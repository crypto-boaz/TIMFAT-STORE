import json
import re
import secrets
import time
from time import time as epoch_time
from datetime import timedelta
from decimal import Decimal
from functools import wraps

import bcrypt
import jwt
from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Prefetch, Q
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    Category,
    Customer,
    CustomerRequest,
    Debt,
    DebtStatus,
    Delivery,
    Expense,
    InventoryLog,
    Notification,
    Payment,
    PaymentStatus,
    Product,
    Role,
    Sale,
    SaleItem,
    Store,
    Supplier,
    User,
)


def json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def json_error(message, status=400, **extra):
    return JsonResponse({"message": message, **extra}, status=status)


def to_float(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def iso(value):
    return value.isoformat() if value else None


def sign_token(user):
    payload = {
        "id": user.id,
        "email": user.email,
        "username": user.username or user.email,
        "role": user.role,
        "storeId": user.store_id,
        "exp": timezone.now() + timedelta(hours=8),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def user_response(user):
    store = user.store
    return {
        "id": user.id,
        "username": user.username or user.email,
        "name": user.name,
        "companyName": user.company_name or (store.store_name if store else ""),
        "email": user.email,
        "role": user.role,
        "storeId": user.store_id,
        "store": {"id": store.id, "storeName": store.store_name, "subscriptionPlan": store.subscription_plan} if store else None,
    }


def people_user_response(user):
    return {
        "id": user.id,
        "username": user.username or user.email,
        "name": user.name,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "gender": user.gender,
        "companyName": user.company_name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
        "status": "ACTIVE" if user.active else "INACTIVE",
        "active": user.active,
        "createdAt": iso(user.created_at),
        "updatedAt": iso(user.updated_at),
    }


def password_validation_error(password):
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if not re.search(r"[A-Z]", password):
        return "Password must include at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must include at least one lowercase letter."
    if not re.search(r"[0-9]", password):
        return "Password must include at least one number."
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password must include at least one special character."
    return ""


def unique_username_from_email(email, exclude_user_id=None):
    base = re.sub(r"[^a-zA-Z0-9_.-]", "", email.split("@")[0].lower()) or "user"
    candidate = base[:150]
    suffix = 1
    query = User.objects.filter(username__iexact=candidate)
    if exclude_user_id:
        query = query.exclude(id=exclude_user_id)
    while query.exists():
        suffix += 1
        suffix_text = f"-{suffix}"
        candidate = f"{base[:150 - len(suffix_text)]}{suffix_text}"
        query = User.objects.filter(username__iexact=candidate)
        if exclude_user_id:
            query = query.exclude(id=exclude_user_id)
    return candidate


def default_store():
    store, _ = Store.objects.get_or_create(
        id="default-store",
        defaults={"store_name": "King's Store", "subscription_plan": "FREE"},
    )
    return store


def app_user_from_django_superuser(django_user):
    email = (django_user.email or f"{django_user.username}@django.local").strip().lower()
    name = django_user.get_full_name() or django_user.username
    user = User.objects.filter(Q(username__iexact=django_user.username) | Q(email__iexact=email)).first()
    password_hash = bcrypt.hashpw(secrets.token_urlsafe(32).encode(), bcrypt.gensalt()).decode()
    defaults = {
        "username": django_user.username,
        "name": name,
        "email": email,
        "role": Role.ADMIN,
        "store": default_store(),
        "active": True,
    }
    if user:
        for field, value in defaults.items():
            setattr(user, field, value)
        user.save()
        return user
    return User.objects.create(password_hash=password_hash, **defaults)


def login_identifier(body):
    return str(body.get("username") or body.get("email") or body.get("identifier") or "").strip()


def verify_supabase_token(token):
    if not token:
        raise jwt.PyJWTError("Missing Supabase token")
    decode_errors = []

    jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", "")
    if jwt_secret:
        try:
            return jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError as exc:
            decode_errors.append(exc)

    # Fallback for projects using asymmetric signing keys.
    jwks_url = getattr(settings, "SUPABASE_JWKS_URL", "")
    if jwks_url:
        try:
            jwks_client = jwt.PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError as exc:
            decode_errors.append(exc)

    if decode_errors:
        if settings.DEBUG:
            try:
                payload = jwt.decode(
                    token,
                    options={"verify_signature": False, "verify_aud": False},
                )
                exp = payload.get("exp")
                if exp and int(exp) < int(epoch_time()):
                    raise jwt.ExpiredSignatureError("Supabase token has expired")
                return payload
            except jwt.PyJWTError as exc:
                decode_errors.append(exc)
        raise decode_errors[-1]
    raise jwt.PyJWTError("Supabase JWT verification is not configured")


def auth_required(roles=None):
    roles = set(roles or [])

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            auth = request.headers.get("Authorization", "")
            token = auth[7:] if auth.startswith("Bearer ") else None
            if not token:
                return json_error("Authentication required", status=401)
            try:
                payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            except jwt.PyJWTError:
                return json_error("Invalid or expired session", status=401)
            role = payload.get("role")
            if roles and role not in roles and not (role == Role.OWNER and Role.ADMIN in roles):
                return json_error("Insufficient permissions", status=403)
            user = User.objects.select_related("store").filter(id=payload.get("id"), active=True).first()
            if not user or not user.store_id:
                return json_error("Invalid account workspace", status=401)
            request.app_user = user
            request.store = user.store
            request.user_payload = payload
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def category_json(category):
    return {
        "id": category.id,
        "name": category.name,
        "createdAt": iso(category.created_at),
    }


def supplier_json(supplier, include_children=False):
    data = {
        "id": supplier.id,
        "name": supplier.name,
        "contact": supplier.contact,
        "email": supplier.email,
        "address": supplier.address,
        "createdAt": iso(supplier.created_at),
        "updatedAt": iso(supplier.updated_at),
    }
    if include_children:
        data["deliveries"] = [delivery_json(item) for item in supplier.deliveries.all()]
        data["payments"] = [payment_json(item) for item in supplier.payments.all()]
    return data


def product_json(product, include_relations=False):
    data = {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "sku": product.sku or "",
        "serialCode": product.serial_code or "",
        "categoryId": product.category_id,
        "quantity": product.quantity,
        "costPrice": to_float(product.cost_price),
        "sellingPrice": to_float(product.selling_price),
        "lowStockAt": product.low_stock_at,
        "supplierId": product.supplier_id,
        "createdAt": iso(product.created_at),
        "updatedAt": iso(product.updated_at),
    }
    if include_relations:
        data["category"] = category_json(product.category) if product.category_id else None
        data["supplier"] = supplier_json(product.supplier) if product.supplier_id else None
    return data


def customer_json(customer, include_children=False):
    data = {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "address": customer.address,
        "createdAt": iso(customer.created_at),
        "updatedAt": iso(customer.updated_at),
    }
    if include_children:
        data["debts"] = [debt_json(debt) for debt in customer.debts.all()]
        data["sales"] = [sale_json(sale) for sale in customer.sales.all()]
    return data


def sale_item_json(item, include_product=False):
    data = {
        "id": item.id,
        "saleId": item.sale_id,
        "productId": item.product_id,
        "quantity": item.quantity,
        "unitPrice": to_float(item.unit_price),
        "total": to_float(item.total),
    }
    if include_product:
        data["product"] = product_json(item.product)
    return data


def sale_json(sale, include_relations=False):
    data = {
        "id": sale.id,
        "invoiceNo": sale.invoice_no,
        "customerId": sale.customer_id,
        "subtotal": to_float(sale.subtotal),
        "discount": to_float(sale.discount),
        "total": to_float(sale.total),
        "amountPaid": to_float(sale.amount_paid),
        "paymentMethod": sale.payment_method,
        "status": sale.status,
        "createdAt": iso(sale.created_at),
        "updatedAt": iso(sale.updated_at),
    }
    if include_relations:
        data["customer"] = customer_json(sale.customer)
        data["items"] = [sale_item_json(item, include_product=True) for item in sale.items.all()]
    return data


def debt_json(debt, include_relations=False):
    data = {
        "id": debt.id,
        "customerId": debt.customer_id,
        "saleId": debt.sale_id,
        "total": to_float(debt.total),
        "amountPaid": to_float(debt.amount_paid),
        "dueDate": iso(debt.due_date),
        "status": debt.status,
        "createdAt": iso(debt.created_at),
        "updatedAt": iso(debt.updated_at),
    }
    if include_relations:
        data["customer"] = customer_json(debt.customer)
        data["payments"] = [payment_json(payment) for payment in debt.payments.all()]
    return data


def delivery_json(delivery):
    return {
        "id": delivery.id,
        "supplierId": delivery.supplier_id,
        "productName": delivery.product_name,
        "quantity": delivery.quantity,
        "costPrice": to_float(delivery.cost_price),
        "total": to_float(delivery.total),
        "amountPaid": to_float(delivery.amount_paid),
        "deliveredAt": iso(delivery.delivered_at),
    }


def expense_json(expense):
    return {
        "id": expense.id,
        "category": expense.category,
        "description": expense.description,
        "amount": to_float(expense.amount),
        "date": iso(expense.date),
        "createdAt": iso(expense.created_at),
    }


def payment_json(payment):
    return {
        "id": payment.id,
        "customerId": payment.customer_id,
        "supplierId": payment.supplier_id,
        "saleId": payment.sale_id,
        "debtId": payment.debt_id,
        "amount": to_float(payment.amount),
        "method": payment.method,
        "reference": payment.reference,
        "paidAt": iso(payment.paid_at),
    }


def notification_json(notification):
    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "priority": notification.priority,
        "readAt": iso(notification.read_at),
        "createdAt": iso(notification.created_at),
    }


def decimal_from_body(body, key, default=None):
    value = body.get(key, default)
    return Decimal(str(value)) if value is not None else None


def parse_datetime(value):
    if not value:
        return None
    parsed = timezone.datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if timezone.is_aware(parsed) else timezone.make_aware(parsed)


def frontend_id(value, prefix):
    value = str(value or f"{prefix}-{int(time.time() * 1000)}")
    return value[:32]


def frontend_date(value):
    return parse_datetime(value) or timezone.now()


def sync_business_data_to_tables(payload, store):
    categories = {}
    suppliers = {}
    products = {}
    customers = {}

    def category_for(name):
        name = str(name or "Uncategorized").strip() or "Uncategorized"
        if name not in categories:
            categories[name], _ = Category.objects.get_or_create(store=store, name=name)
        return categories[name]

    def supplier_for(name, supplier_id=None, defaults=None):
        name = str(name or "").strip()
        if not name:
            return None
        if name not in suppliers:
            defaults = defaults or {}
            supplier = Supplier.objects.filter(store=store, name=name).first()
            if supplier:
                for field, value in defaults.items():
                    setattr(supplier, field, value)
                supplier.save()
            else:
                supplier = Supplier.objects.create(
                    id=frontend_id(supplier_id, "SUP"),
                    store=store,
                    name=name,
                    **defaults,
                )
            suppliers[name] = supplier
        return suppliers[name]

    def customer_for(name):
        name = str(name or "Walk-in Customer").strip() or "Walk-in Customer"
        if name not in customers:
            customers[name], _ = Customer.objects.get_or_create(store=store, name=name)
        return customers[name]

    for item in payload.get("suppliers", []):
        supplier = supplier_for(
            item.get("name"),
            item.get("id"),
            {
                "contact": item.get("contact") or None,
                "email": item.get("email") or None,
                "address": item.get("address") or None,
            },
        )
        if not supplier:
            continue
        delivery_id = frontend_id(f"DEL-{item.get('id', supplier.id)}", "DEL")
        Delivery.objects.update_or_create(
            id=delivery_id,
            defaults={
                "store": store,
                "supplier": supplier,
                "product_name": item.get("product") or "Unspecified product",
                "quantity": int(item.get("quantity") or 0),
                "cost_price": decimal_from_body(item, "costPrice", 0),
                "total": decimal_from_body(item, "total", 0),
                "amount_paid": decimal_from_body(item, "paid", 0),
                "delivered_at": frontend_date(item.get("deliveryDate")),
            },
        )

    for item in payload.get("products", []):
        product_id = frontend_id(item.get("id"), "P")
        serial_code = str(item.get("serialCode") or "").strip() or None
        supplier = supplier_for(item.get("supplier"))
        product = Product.objects.filter(store=store, id=product_id).first()
        if product is None and serial_code:
            product = Product.objects.filter(store=store).filter(Q(serial_code__iexact=serial_code) | Q(sku__iexact=serial_code)).first()

        defaults = {
            "store": store,
            "name": item.get("name") or "Unnamed product",
            "description": item.get("description") or None,
            "sku": serial_code,
            "serial_code": serial_code,
            "category": category_for(item.get("category")),
            "quantity": int(item.get("quantity") or 0),
            "cost_price": decimal_from_body(item, "costPrice", 0),
            "selling_price": decimal_from_body(item, "unitPrice", 0),
            "low_stock_at": int(item.get("lowStockAt") or 0),
            "supplier": supplier,
        }
        if product is None:
            product = Product.objects.create(id=product_id, **defaults)
        else:
            for field, value in defaults.items():
                setattr(product, field, value)
            product.save()
        products[item.get("id")] = product
        for entry in item.get("transactionHistory", []):
            InventoryLog.objects.update_or_create(
                id=frontend_id(entry.get("id"), "TX"),
                defaults={
                    "store": store,
                    "product": product,
                    "type": entry.get("type") or "Adjustment",
                    "quantity": int(entry.get("quantity") or 0),
                    "note": entry.get("note") or None,
                    "created_at": frontend_date(entry.get("date")),
                },
            )

    status_map = {"Paid": PaymentStatus.PAID, "Partial": PaymentStatus.PARTIAL, "Unpaid": PaymentStatus.UNPAID}
    for item in payload.get("sales", []):
        sale_id = frontend_id(item.get("id"), "SALE")
        total = decimal_from_body(item, "total", 0)
        paid = decimal_from_body(item, "paid", 0)
        sale, _ = Sale.objects.update_or_create(
            id=sale_id,
            defaults={
                "store": store,
                "invoice_no": item.get("id") or sale_id,
                "customer": customer_for(item.get("customer")),
                "subtotal": total,
                "discount": Decimal("0"),
                "total": total,
                "amount_paid": paid,
                "payment_method": item.get("method") or "Cash",
                "status": status_map.get(item.get("status"), PaymentStatus.UNPAID),
                "created_at": frontend_date(item.get("date")),
            },
        )
        product = next((value for value in products.values() if value.name == item.get("product")), None)
        if product:
            quantity = max(1, int(item.get("quantity") or 1))
            SaleItem.objects.update_or_create(
                id=frontend_id(f"ITEM-{sale_id}", "ITEM"),
                defaults={
                    "store": store,
                    "sale": sale,
                    "product": product,
                    "quantity": quantity,
                    "unit_price": total / quantity,
                    "total": total,
                },
            )

    debt_status_map = {"Current": DebtStatus.CURRENT, "Overdue": DebtStatus.OVERDUE, "Settled": DebtStatus.SETTLED}
    for item in payload.get("debts", []):
        debt, _ = Debt.objects.update_or_create(
            id=frontend_id(item.get("id"), "D"),
            defaults={
                "store": store,
                "customer": customer_for(item.get("customer")),
                "total": decimal_from_body(item, "total", 0),
                "amount_paid": decimal_from_body(item, "paid", 0),
                "due_date": frontend_date(item.get("dueDate")),
                "status": debt_status_map.get(item.get("status"), DebtStatus.CURRENT),
            },
        )
        for entry in item.get("paymentHistory", []):
            Payment.objects.update_or_create(
                id=frontend_id(entry.get("id"), "PAY"),
                defaults={
                    "store": store,
                    "customer": debt.customer,
                    "debt": debt,
                    "amount": decimal_from_body(entry, "amount", 0),
                    "method": entry.get("method") or "Cash",
                    "reference": entry.get("reference") or None,
                    "paid_at": frontend_date(entry.get("date")),
                },
            )

    for item in payload.get("expenses", []):
        Expense.objects.update_or_create(
            id=frontend_id(item.get("id"), "EXP"),
            defaults={
                "store": store,
                "category": item.get("category") or "Other",
                "description": item.get("description") or "",
                "amount": decimal_from_body(item, "amount", 0),
                "date": frontend_date(item.get("date")),
            },
        )

    for item in payload.get("customerRequests", []):
        CustomerRequest.objects.update_or_create(
            id=frontend_id(item.get("id"), "REQ"),
            defaults={
                "store": store,
                "product_name": item.get("productName") or "Unspecified product",
                "quantity": int(item.get("quantity") or 0),
                "customer_name": item.get("customerName") or None,
                "date_requested": frontend_date(item.get("dateRequested")).date(),
                "notes": item.get("notes") or None,
                "status": item.get("status") or "Open",
            },
        )


def business_data_from_tables(store):
    product_queryset = Product.objects.filter(store=store).select_related("category", "supplier").prefetch_related(
        Prefetch("stock_logs", queryset=InventoryLog.objects.order_by("-created_at"), to_attr="prefetched_stock_logs")
    ).order_by("name")
    products = [
        {
            "id": item.id,
            "serialCode": item.serial_code or "",
            "name": item.name,
            "description": item.description or "",
            "category": item.category.name if item.category_id else "Uncategorized",
            "quantity": item.quantity,
            "unitPrice": to_float(item.selling_price),
            "costPrice": to_float(item.cost_price),
            "supplier": item.supplier.name if item.supplier_id else "",
            "dateAdded": item.created_at.date().isoformat(),
            "updatedAt": item.updated_at.date().isoformat(),
            "lowStockAt": item.low_stock_at,
            "transactionHistory": [
                {
                    "id": log.id,
                    "type": log.type,
                    "quantity": log.quantity,
                    "note": log.note or "",
                    "date": log.created_at.date().isoformat(),
                }
                for log in getattr(item, "prefetched_stock_logs", [])
            ],
        }
        for item in product_queryset
    ]
    categories = list(Category.objects.filter(store=store).order_by("name").values_list("name", flat=True))
    suppliers = []
    for supplier in Supplier.objects.filter(store=store).prefetch_related("deliveries").order_by("name"):
        delivery = supplier.deliveries.order_by("-delivered_at").first()
        suppliers.append({
            "id": supplier.id,
            "name": supplier.name,
            "contact": supplier.contact or "",
            "email": supplier.email or "",
            "address": supplier.address or "",
            "product": delivery.product_name if delivery else "",
            "quantity": delivery.quantity if delivery else 0,
            "costPrice": to_float(delivery.cost_price) if delivery else 0,
            "total": to_float(delivery.total) if delivery else 0,
            "paid": to_float(delivery.amount_paid) if delivery else 0,
            "deliveryDate": delivery.delivered_at.date().isoformat() if delivery else timezone.now().date().isoformat(),
            "dueDate": "",
        })
    sales = []
    for sale in Sale.objects.filter(store=store).select_related("customer").prefetch_related("items__product").order_by("-created_at"):
        items = list(sale.items.all())
        sales.append({
            "id": sale.invoice_no,
            "customer": sale.customer.name,
            "product": ", ".join(item.product.name for item in items),
            "quantity": sum(item.quantity for item in items),
            "total": to_float(sale.total),
            "paid": to_float(sale.amount_paid),
            "status": sale.status.title().replace("Unpaid", "Unpaid"),
            "date": sale.created_at.date().isoformat(),
            "method": sale.payment_method,
        })
    debts = []
    for debt in Debt.objects.filter(store=store).select_related("customer", "sale").prefetch_related("payments", "sale__items__product").order_by("due_date"):
        sale_items = list(debt.sale.items.all()) if debt.sale_id else []
        debts.append({
            "id": debt.id,
            "customer": debt.customer.name,
            "product": ", ".join(item.product.name for item in sale_items),
            "quantity": sum(item.quantity for item in sale_items),
            "total": to_float(debt.total),
            "paid": to_float(debt.amount_paid),
            "dueDate": debt.due_date.date().isoformat(),
            "status": debt.status.title(),
            "paymentHistory": [
                {
                    "id": payment.id,
                    "amount": to_float(payment.amount),
                    "method": payment.method,
                    "date": payment.paid_at.date().isoformat(),
                    "reference": payment.reference or "",
                }
                for payment in debt.payments.order_by("-paid_at")
            ],
        })
    return {
        "products": products,
        "categories": categories,
        "suppliers": suppliers,
        "expenses": [
            {
                "id": item.id,
                "category": item.category,
                "description": item.description,
                "amount": to_float(item.amount),
                "date": item.date.date().isoformat(),
            }
            for item in Expense.objects.filter(store=store).order_by("-date")
        ],
        "debts": debts,
        "sales": sales,
        "cart": [],
        "customerRequests": [
            {
                "id": item.id,
                "productName": item.product_name,
                "quantity": item.quantity,
                "customerName": item.customer_name or "",
                "dateRequested": item.date_requested.isoformat(),
                "notes": item.notes or "",
                "status": item.status,
            }
            for item in CustomerRequest.objects.filter(store=store).order_by("-date_requested")
        ],
    }


@require_http_methods(["GET"])
def health(_request):
    return JsonResponse({"ok": True, "service": "PayTrack Business API"})


@csrf_exempt
@require_http_methods(["GET", "PUT"])
@auth_required()
def business_snapshot(request):
    if request.method == "GET":
        return JsonResponse({"data": business_data_from_tables(request.store), "updatedAt": timezone.now().isoformat()})

    body = json_body(request)
    payload = body.get("data", body)
    with transaction.atomic():
        sync_business_data_to_tables(payload, request.store)
    return JsonResponse({"ok": True, "data": business_data_from_tables(request.store), "updatedAt": timezone.now().isoformat()})


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    body = json_body(request)
    identifier = login_identifier(body)
    password = str(body.get("password", ""))
    if not identifier or not password:
        return json_error("Username and password are required.", status=400)

    django_user = authenticate(request, username=identifier, password=password)
    if django_user and django_user.is_active and django_user.is_superuser:
        user = app_user_from_django_superuser(django_user)
        return JsonResponse({"token": sign_token(user), "user": user_response(user)})

    user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier), active=True).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return json_error("Invalid username or password", status=401)
    return JsonResponse({
        "token": sign_token(user),
        "user": user_response(user),
    })


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    if not settings.REGISTRATION_ENABLED:
        return json_error("Registration is disabled.", status=403)
    body = json_body(request)
    username = str(body.get("username", "")).strip().lower()
    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    store_name = str(body.get("storeName") or body.get("businessName") or name or username).strip()

    if not username:
        return json_error("Username is required.")
    if not re.match(r"^[a-zA-Z0-9_.-]{3,150}$", username):
        return json_error("Username must be 3-150 characters and use only letters, numbers, dots, dashes, or underscores.")
    if not name:
        return json_error("Full name is required.")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return json_error("Enter a valid email address.")
    if len(password) < 8:
        return json_error("Password must be at least 8 characters.")
    if not store_name:
        return json_error("Business/store name is required.")
    if User.objects.filter(username__iexact=username).exists():
        return json_error("An account with this username already exists.", status=409)
    if User.objects.filter(email=email).exists():
        return json_error("An account with this email already exists.", status=409)

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    with transaction.atomic():
        store = Store.objects.create(store_name=store_name)
        user = User.objects.create(
            store=store,
            username=username,
            name=name,
            email=email,
            password_hash=password_hash,
            role=Role.OWNER,
            active=True,
        )
    return JsonResponse({"token": sign_token(user), "user": user_response(user)}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def supabase_session(request):
    body = json_body(request)
    token = str(body.get("accessToken") or "").strip()
    try:
        payload = verify_supabase_token(token)
    except jwt.PyJWTError:
        return json_error("Invalid or expired Supabase session", status=401)

    email = str(payload.get("email") or "").strip().lower()
    supabase_user_id = str(payload.get("sub") or "").strip()
    metadata = payload.get("user_metadata") or {}
    email_verified = payload.get("email_verified", payload.get("app_metadata", {}).get("email_verified", True))
    if not email:
        return json_error("Supabase session does not include an email address.", status=400)
    if email_verified is False:
        return json_error("Please verify your email before signing in.", status=403)

    full_name = str(metadata.get("full_name") or metadata.get("name") or email.split("@")[0]).strip()
    store_name = str(metadata.get("store_name") or metadata.get("business_name") or full_name or "My Store").strip()

    with transaction.atomic():
        user = User.objects.select_related("store").filter(email__iexact=email).first()
        if user and not user.store_id:
            store = Store.objects.create(store_name=store_name)
            user.store = store
            user.role = Role.OWNER
        elif user:
            store = user.store
        else:
            store = Store.objects.create(store_name=store_name)
            password_hash = bcrypt.hashpw(secrets.token_urlsafe(32).encode(), bcrypt.gensalt()).decode()
            user = User(
                store=store,
                username=email,
                email=email,
                password_hash=password_hash,
                role=Role.OWNER,
                active=True,
            )
        user.name = full_name
        user.username = user.username or email
        user.email = email
        user.active = True
        user.save()

    return JsonResponse({
        "token": sign_token(user),
        "user": user_response(User.objects.select_related("store").get(id=user.id)),
        "supabaseUserId": supabase_user_id,
    })


@require_http_methods(["GET"])
@auth_required()
def me(request):
    user = User.objects.select_related("store").filter(id=request.user_payload.get("id"), active=True).first()
    if not user:
        return json_error("Invalid or expired session", status=401)
    return JsonResponse({"user": user_response(user)})


@csrf_exempt
@require_http_methods(["GET", "POST"])
@auth_required({Role.OWNER, Role.ADMIN})
def users(request):
    if request.method == "GET":
        rows = User.objects.filter(store=request.store).order_by("-active", "name", "email")
        return JsonResponse({"users": [people_user_response(user) for user in rows]})

    body = json_body(request)
    first_name = str(body.get("firstName") or body.get("first_name") or "").strip()
    last_name = str(body.get("lastName") or body.get("last_name") or "").strip()
    gender = str(body.get("gender") or "").strip()
    company_name = str(body.get("companyName") or body.get("company_name") or request.store.store_name).strip()
    phone = str(body.get("phone") or "").strip()
    email = str(body.get("email") or "").strip().lower()
    password = str(body.get("password") or "")
    confirm_password = str(body.get("confirmPassword") or body.get("confirm_password") or "")
    role = str(body.get("role") or Role.STAFF).strip().upper()
    status = str(body.get("status") or "ACTIVE").strip().upper()

    if not first_name:
        return json_error("First name is required.")
    if not last_name:
        return json_error("Last name is required.")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return json_error("Enter a valid email address.")
    if User.objects.filter(email__iexact=email).exists():
        return json_error("Email already exists.")
    if password != confirm_password:
        return json_error("Passwords do not match.")
    password_error = password_validation_error(password)
    if password_error:
        return json_error(password_error)
    allowed_roles = {Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.SALES_STAFF, Role.INVENTORY_STAFF, Role.STAFF, Role.ACCOUNTANT, Role.WAREHOUSE}
    if role not in allowed_roles:
        return json_error("Choose a valid user role.")
    if status not in {"ACTIVE", "INACTIVE"}:
        return json_error("Choose a valid user status.")

    full_name = str(body.get("name") or f"{first_name} {last_name}").strip()
    user = User.objects.create(
        store=request.store,
        username=unique_username_from_email(email),
        name=full_name,
        first_name=first_name,
        last_name=last_name,
        gender=gender,
        company_name=company_name,
        phone=phone,
        email=email,
        password_hash=bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
        role=role,
        active=status == "ACTIVE",
    )
    return JsonResponse({"user": people_user_response(user)}, status=201)


@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
@auth_required({Role.OWNER, Role.ADMIN})
def user_detail(request, user_id):
    user = User.objects.filter(id=user_id, store=request.store).first()
    if not user:
        return json_error("User not found.", status=404)
    if request.method == "DELETE":
        if user.id == request.app_user.id:
            return json_error("You cannot remove your own account while signed in.", status=400)
        if user.role == Role.OWNER:
            return json_error("Owner accounts cannot be removed from People.", status=400)
        user.delete()
        return JsonResponse({"ok": True})

    body = json_body(request)
    first_name = str(body.get("firstName") or body.get("first_name") or user.first_name).strip()
    last_name = str(body.get("lastName") or body.get("last_name") or user.last_name).strip()
    gender = str(body.get("gender") if body.get("gender") is not None else user.gender).strip()
    company_name = str(body.get("companyName") or body.get("company_name") or user.company_name or request.store.store_name).strip()
    phone = str(body.get("phone") if body.get("phone") is not None else user.phone).strip()
    email = str(body.get("email") or user.email).strip().lower()
    role = str(body.get("role") or user.role).strip().upper()
    status = str(body.get("status") or ("ACTIVE" if user.active else "INACTIVE")).strip().upper()
    password = str(body.get("password") or "")
    confirm_password = str(body.get("confirmPassword") or body.get("confirm_password") or "")

    if not first_name:
        return json_error("First name is required.")
    if not last_name:
        return json_error("Last name is required.")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return json_error("Enter a valid email address.")
    if User.objects.filter(email__iexact=email).exclude(id=user.id).exists():
        return json_error("Email already exists.")
    allowed_roles = {Role.OWNER, Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.SALES_STAFF, Role.INVENTORY_STAFF, Role.STAFF, Role.ACCOUNTANT, Role.WAREHOUSE}
    if role not in allowed_roles:
        return json_error("Choose a valid user role.")
    if status not in {"ACTIVE", "INACTIVE"}:
        return json_error("Choose a valid user status.")
    if user.id == request.app_user.id and status == "INACTIVE":
        return json_error("You cannot deactivate your own account while signed in.", status=400)
    if password or confirm_password:
        if password != confirm_password:
            return json_error("Passwords do not match.")
        password_error = password_validation_error(password)
        if password_error:
            return json_error(password_error)
        user.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    user.first_name = first_name
    user.last_name = last_name
    user.name = str(body.get("name") or f"{first_name} {last_name}").strip()
    user.gender = gender
    user.company_name = company_name
    user.phone = phone
    user.email = email
    user.username = unique_username_from_email(email, exclude_user_id=user.id)
    user.role = role
    user.active = status == "ACTIVE"
    user.save()
    return JsonResponse({"user": people_user_response(user)})


@require_http_methods(["GET"])
@auth_required()
def dashboard(request):
    store = request.store
    products = Product.objects.filter(store=store).select_related("category", "supplier").order_by("-updated_at")
    sales = Sale.objects.filter(store=store).select_related("customer").prefetch_related("items__product").order_by("-created_at")[:12]
    debts = Debt.objects.filter(store=store).select_related("customer").order_by("due_date")
    expenses = Expense.objects.filter(store=store).order_by("-date")[:25]
    suppliers = Supplier.objects.filter(store=store).order_by("name")
    notifications = Notification.objects.filter(store=store, read_at__isnull=True).order_by("-created_at")[:20]
    return JsonResponse({
        "products": [product_json(item, include_relations=True) for item in products],
        "sales": [sale_json(item, include_relations=True) for item in sales],
        "debts": [debt_json(item, include_relations=True) for item in debts],
        "expenses": [expense_json(item) for item in expenses],
        "suppliers": [supplier_json(item) for item in suppliers],
        "notifications": [notification_json(item) for item in notifications],
    })



def upsert_frontend_product(body, store):
    product_id = frontend_id(body.get("id"), "P")
    serial_code = str(body.get("serialCode") or body.get("sku") or "").strip() or None
    category_name = str(body.get("category") or "Uncategorized").strip() or "Uncategorized"
    category, _ = Category.objects.get_or_create(store=store, name=category_name)

    supplier = None
    supplier_name = str(body.get("supplier") or "").strip()
    if supplier_name:
        supplier, _ = Supplier.objects.get_or_create(store=store, name=supplier_name)

    product = Product.objects.filter(store=store, id=product_id).first()
    if product is None and serial_code:
        product = Product.objects.filter(store=store).filter(Q(serial_code__iexact=serial_code) | Q(sku__iexact=serial_code)).first()

    defaults = {
        "store": store,
        "name": body.get("name") or "Unnamed product",
        "description": body.get("description") or None,
        "sku": serial_code,
        "serial_code": serial_code,
        "category": category,
        "quantity": int(body.get("quantity") or 0),
        "cost_price": decimal_from_body(body, "costPrice", body.get("costPrice", 0)),
        "selling_price": decimal_from_body(body, "unitPrice", body.get("sellingPrice", 0)),
        "low_stock_at": int(body.get("lowStockAt") or 0),
        "supplier": supplier,
    }
    created = product is None
    if product is None:
        product = Product.objects.create(id=product_id, **defaults)
    else:
        for field, value in defaults.items():
            setattr(product, field, value)
        product.save()

    if created:
        InventoryLog.objects.create(store=store, product=product, type="STOCK_IN", quantity=product.quantity, note="Product created")
    return product, created


@csrf_exempt
@require_http_methods(["POST"])
@auth_required(["ADMIN", "WAREHOUSE"])
def product_sync(request):
    body = json_body(request)
    product, created = upsert_frontend_product(body, request.store)
    return JsonResponse({"ok": True, "product": product_json(product, include_relations=True)}, status=201 if created else 200)


@csrf_exempt
@require_http_methods(["POST"])
@auth_required(["ADMIN", "WAREHOUSE"])
def products_bulk_sync(request):
    body = json_body(request)
    items = body.get("products", [])
    if not isinstance(items, list):
        return json_error("Products must be a list.")
    if len(items) > 1000:
        return json_error("Import a maximum of 1000 products at once.")

    created_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []
    products = []
    with transaction.atomic():
        for index, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                skipped_count += 1
                errors.append({"row": index, "message": "Row is not a valid product."})
                continue
            if not str(item.get("name") or "").strip():
                skipped_count += 1
                errors.append({"row": index, "message": "Product name is required."})
                continue
            try:
                product, created = upsert_frontend_product(item, request.store)
            except (ValueError, TypeError) as exc:
                skipped_count += 1
                errors.append({"row": index, "message": str(exc) or "Unable to save product."})
                continue
            created_count += int(created)
            updated_count += int(not created)
            products.append(product_json(product, include_relations=True))

    return JsonResponse({
        "ok": True,
        "created": created_count,
        "updated": updated_count,
        "skipped": skipped_count,
        "errors": errors,
        "products": products,
    })
@csrf_exempt
@require_http_methods(["GET", "POST"])
@auth_required()
def products(request):
    if request.method == "GET":
        queryset = Product.objects.filter(store=request.store).select_related("category", "supplier").order_by("name")
        search = str(request.GET.get("search") or "").strip()
        category = str(request.GET.get("category") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(serial_code__icontains=search) |
                Q(sku__icontains=search) |
                Q(category__name__icontains=search)
            )
        if category:
            queryset = queryset.filter(category__name__iexact=category)

        page = request.GET.get("page")
        if page:
            page_size = min(max(int(request.GET.get("pageSize", 100)), 1), 500)
            page_obj = Paginator(queryset, page_size).get_page(page)
            return JsonResponse({
                "items": [product_json(item, include_relations=True) for item in page_obj.object_list],
                "page": page_obj.number,
                "pageSize": page_size,
                "total": page_obj.paginator.count,
                "pages": page_obj.paginator.num_pages,
            })

        return JsonResponse([product_json(item, include_relations=True) for item in queryset], safe=False)
    if request.user_payload["role"] not in {"OWNER", "ADMIN", "WAREHOUSE", "INVENTORY_STAFF"}:
        return json_error("Insufficient permissions", status=403)
    body = json_body(request)
    category = Category.objects.filter(store=request.store, id=body["categoryId"]).first()
    if not category:
        return json_error("Category not found.", status=404)
    supplier = None
    if body.get("supplierId"):
        supplier = Supplier.objects.filter(store=request.store, id=body.get("supplierId")).first()
        if not supplier:
            return json_error("Supplier not found.", status=404)
    product = Product.objects.create(
        store=request.store,
        name=body["name"],
        description=body.get("description"),
        sku=body.get("sku") or body.get("serialCode") or None,
        serial_code=body.get("serialCode") or None,
        category=category,
        quantity=int(body.get("quantity", 0)),
        cost_price=decimal_from_body(body, "costPrice", 0),
        selling_price=decimal_from_body(body, "sellingPrice", 0),
        low_stock_at=int(body.get("lowStockAt", 20)),
        supplier=supplier,
    )
    InventoryLog.objects.create(store=request.store, product=product, type="STOCK_IN", quantity=product.quantity, note="Initial stock")
    return JsonResponse(product_json(product), status=201)


@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
@auth_required(["ADMIN", "WAREHOUSE"])
def product_detail(request, product_id):
    product = Product.objects.get(store=request.store, id=product_id)
    if request.method == "DELETE":
        if request.user_payload["role"] not in {"OWNER", "ADMIN"}:
            return json_error("Insufficient permissions", status=403)
        product.delete()
        return JsonResponse({}, status=204)
    body = json_body(request)
    field_map = {
        "name": "name",
        "description": "description",
        "sku": "sku",
        "serialCode": "serial_code",
        "categoryId": "category_id",
        "quantity": "quantity",
            "sellingPrice": "selling_price",
            "costPrice": "cost_price",
        "lowStockAt": "low_stock_at",
        "supplierId": "supplier_id",
    }
    for body_key, model_key in field_map.items():
        if body_key in body:
            value = body[body_key]
            if body_key in {"sku", "serialCode"} and not value:
                value = None
            if body_key == "categoryId":
                if not Category.objects.filter(store=request.store, id=value).exists():
                    return json_error("Category not found.", status=404)
            if body_key == "supplierId" and value:
                if not Supplier.objects.filter(store=request.store, id=value).exists():
                    return json_error("Supplier not found.", status=404)
            setattr(product, model_key, value)
    product.save()
    return JsonResponse(product_json(product))


@require_http_methods(["GET"])
@auth_required()
def categories(request):
    return JsonResponse([category_json(item) for item in Category.objects.filter(store=request.store).order_by("name")], safe=False)


@require_http_methods(["GET"])
@auth_required()
def customers(request):
    queryset = Customer.objects.filter(store=request.store).prefetch_related("debts", "sales").order_by("name")
    return JsonResponse([customer_json(item, include_children=True) for item in queryset], safe=False)


@csrf_exempt
@require_http_methods(["GET", "POST"])
@auth_required()
def sales(request):
    if request.method == "GET":
        queryset = Sale.objects.filter(store=request.store).select_related("customer").prefetch_related("items__product").order_by("-created_at")
        return JsonResponse([sale_json(item, include_relations=True) for item in queryset], safe=False)
    if request.user_payload["role"] not in {"OWNER", "ADMIN", "STAFF", "CASHIER", "SALES_STAFF"}:
        return json_error("Insufficient permissions", status=403)

    body = json_body(request)
    items = body.get("items", [])
    subtotal = sum(Decimal(str(item["quantity"])) * Decimal(str(item["unitPrice"])) for item in items)
    discount = decimal_from_body(body, "discount", 0)
    amount_paid = decimal_from_body(body, "amountPaid", 0)
    total = subtotal - discount
    status = PaymentStatus.PAID if amount_paid >= total else PaymentStatus.PARTIAL if amount_paid > 0 else PaymentStatus.UNPAID
    customer = Customer.objects.filter(store=request.store, id=body["customerId"]).first()
    if not customer:
        return json_error("Customer not found.", status=404)

    with transaction.atomic():
        sale = Sale.objects.create(
            store=request.store,
            invoice_no=f"INV-{int(time.time() * 1000)}",
            customer=customer,
            subtotal=subtotal,
            discount=discount,
            total=total,
            amount_paid=amount_paid,
            payment_method=body["paymentMethod"],
            status=status,
        )
        for item in items:
            product = Product.objects.select_for_update().get(store=request.store, id=item["productId"])
            quantity = int(item["quantity"])
            unit_price = Decimal(str(item["unitPrice"]))
            SaleItem.objects.create(store=request.store, sale=sale, product=product, quantity=quantity, unit_price=unit_price, total=quantity * unit_price)
            product.quantity -= quantity
            product.save(update_fields=["quantity", "updated_at"])
            InventoryLog.objects.create(store=request.store, product=product, type="STOCK_OUT", quantity=quantity, note=sale.invoice_no)
        if amount_paid < total:
            due_date = parse_datetime(body.get("dueDate")) or timezone.now() + timedelta(days=7)
            Debt.objects.create(store=request.store, customer_id=body["customerId"], sale=sale, total=total, amount_paid=amount_paid, due_date=due_date, status=DebtStatus.CURRENT)
    return JsonResponse(sale_json(Sale.objects.prefetch_related("items").get(id=sale.id), include_relations=True), status=201)


@require_http_methods(["GET"])
@auth_required()
def debts(request):
    queryset = Debt.objects.filter(store=request.store).select_related("customer").prefetch_related("payments").order_by("due_date")
    return JsonResponse([debt_json(item, include_relations=True) for item in queryset], safe=False)


@csrf_exempt
@require_http_methods(["DELETE"])
@auth_required({Role.OWNER, Role.ADMIN, Role.ACCOUNTANT})
def debt_detail(request, debt_id):
    debt = Debt.objects.filter(store=request.store, id=debt_id).first()
    if not debt:
        return json_error("Debt ledger not found.", status=404)
    debt.delete()
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["GET", "POST"])
@auth_required()
def suppliers(request):
    if request.method == "GET":
        queryset = Supplier.objects.filter(store=request.store).prefetch_related("deliveries", "payments").order_by("name")
        return JsonResponse([supplier_json(item, include_children=True) for item in queryset], safe=False)
    if request.user_payload["role"] not in {"OWNER", "ADMIN", "WAREHOUSE", "INVENTORY_STAFF"}:
        return json_error("Insufficient permissions", status=403)
    body = json_body(request)
    supplier = Supplier.objects.create(store=request.store, name=body["name"], contact=body.get("contact"), email=body.get("email"), address=body.get("address"))
    return JsonResponse(supplier_json(supplier), status=201)


@csrf_exempt
@require_http_methods(["GET", "POST"])
@auth_required(["ADMIN", "ACCOUNTANT"])
def expenses(request):
    if request.method == "GET":
        return JsonResponse([expense_json(item) for item in Expense.objects.filter(store=request.store).order_by("-date")], safe=False)
    body = json_body(request)
    expense = Expense.objects.create(store=request.store, category=body["category"], description=body["description"], amount=decimal_from_body(body, "amount"), date=parse_datetime(body["date"]))
    return JsonResponse(expense_json(expense), status=201)


@csrf_exempt
@require_http_methods(["POST"])
@auth_required(["ADMIN", "ACCOUNTANT", "STAFF"])
def payments(request):
    body = json_body(request)
    related_checks = [
        ("customerId", Customer, "Customer"),
        ("supplierId", Supplier, "Supplier"),
        ("saleId", Sale, "Sale"),
        ("debtId", Debt, "Debt"),
    ]
    for key, model, label in related_checks:
        value = body.get(key)
        if value and not model.objects.filter(store=request.store, id=value).exists():
            return json_error(f"{label} not found.", status=404)
    with transaction.atomic():
        payment = Payment.objects.create(
            store=request.store,
            customer_id=body.get("customerId") or None,
            supplier_id=body.get("supplierId") or None,
            sale_id=body.get("saleId") or None,
            debt_id=body.get("debtId") or None,
            amount=decimal_from_body(body, "amount"),
            method=body["method"],
            reference=body.get("reference"),
        )
        if payment.debt_id:
            debt = Debt.objects.select_for_update().get(store=request.store, id=payment.debt_id)
            debt.amount_paid += payment.amount
            debt.status = DebtStatus.SETTLED if debt.amount_paid >= debt.total else DebtStatus.CURRENT
            debt.save(update_fields=["amount_paid", "status", "updated_at"])
    return JsonResponse(payment_json(payment), status=201)


@require_http_methods(["GET"])
@auth_required()
def notifications(request):
    return JsonResponse([notification_json(item) for item in Notification.objects.filter(store=request.store).order_by("-created_at")], safe=False)


@require_http_methods(["GET"])
@auth_required(["ADMIN", "ACCOUNTANT"])
def reports(request, report_type):
    return JsonResponse({
        "type": report_type,
        "generatedAt": timezone.now().isoformat(),
        "sales": [sale_json(item, include_relations=True) for item in Sale.objects.filter(store=request.store).select_related("customer").prefetch_related("items")],
        "debts": [debt_json(item, include_relations=True) for item in Debt.objects.filter(store=request.store).select_related("customer")],
        "expenses": [expense_json(item) for item in Expense.objects.filter(store=request.store)],
        "inventory": [product_json(item, include_relations=True) for item in Product.objects.filter(store=request.store).select_related("category")],
    })
