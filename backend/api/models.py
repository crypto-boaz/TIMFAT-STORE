from decimal import Decimal

from django.db import models
from django.utils import timezone


def cuid() -> str:
    return f"c{timezone.now().strftime('%Y%m%d%H%M%S%f')}"


class Role(models.TextChoices):
    OWNER = "OWNER", "Owner"
    ADMIN = "ADMIN", "Admin"
    MANAGER = "MANAGER", "Manager"
    CASHIER = "CASHIER", "Cashier"
    SALES_STAFF = "SALES_STAFF", "Sales Staff"
    INVENTORY_STAFF = "INVENTORY_STAFF", "Inventory Staff"
    STAFF = "STAFF", "Staff"
    ACCOUNTANT = "ACCOUNTANT", "Accountant"
    WAREHOUSE = "WAREHOUSE", "Warehouse"


class SubscriptionPlan(models.TextChoices):
    FREE = "FREE", "Free"
    BASIC = "BASIC", "Basic"
    PRO = "PRO", "Pro"
    ENTERPRISE = "ENTERPRISE", "Enterprise"


class PaymentStatus(models.TextChoices):
    PAID = "PAID", "Paid"
    PARTIAL = "PARTIAL", "Partial"
    UNPAID = "UNPAID", "Unpaid"


class DebtStatus(models.TextChoices):
    CURRENT = "CURRENT", "Current"
    OVERDUE = "OVERDUE", "Overdue"
    SETTLED = "SETTLED", "Settled"


class BaseModel(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)

    class Meta:
        abstract = True


class Store(BaseModel):
    store_name = models.CharField(max_length=255, db_column="storeName")
    subscription_plan = models.CharField(max_length=20, choices=SubscriptionPlan, default=SubscriptionPlan.FREE, db_column="subscriptionPlan")
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "Store"
        ordering = ["store_name"]

    def __str__(self) -> str:
        return self.store_name


class User(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.PROTECT, related_name="users", db_column="storeId", null=True, blank=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    name = models.CharField(max_length=255)
    first_name = models.CharField(max_length=120, blank=True, default="", db_column="firstName")
    last_name = models.CharField(max_length=120, blank=True, default="", db_column="lastName")
    gender = models.CharField(max_length=40, blank=True, default="")
    company_name = models.CharField(max_length=255, blank=True, default="", db_column="companyName")
    phone = models.CharField(max_length=80, blank=True, default="")
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255, db_column="passwordHash")
    role = models.CharField(max_length=20, choices=Role, default=Role.STAFF)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "User"

    def __str__(self) -> str:
        return self.username or self.email


class Category(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="categories", db_column="storeId", null=True, blank=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")

    class Meta:
        db_table = "Category"
        ordering = ["name"]
        indexes = [models.Index(fields=["store"], name="category_store_idx")]
        constraints = [models.UniqueConstraint(fields=["store", "name"], name="category_store_name_uniq")]

    def __str__(self) -> str:
        return self.name


class Supplier(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="suppliers", db_column="storeId", null=True, blank=True)
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "Supplier"
        ordering = ["name"]
        indexes = [models.Index(fields=["store"], name="supplier_store_idx")]

    def __str__(self) -> str:
        return self.name


class Product(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="products", db_column="storeId", null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    sku = models.CharField(max_length=255, blank=True, null=True)
    serial_code = models.CharField("barcode", max_length=255, blank=True, null=True, db_column="serialCode")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products", db_column="categoryId")
    quantity = models.IntegerField(default=0)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"), db_column="costPrice")
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, db_column="sellingPrice")
    low_stock_at = models.IntegerField(default=20, db_column="lowStockAt")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True, related_name="products", db_column="supplierId")
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "Product"
        indexes = [
            models.Index(fields=["store"], name="product_store_idx"),
            models.Index(fields=["name"], name="product_name_idx"),
            models.Index(fields=["category"], name="product_category_idx"),
            models.Index(fields=["quantity"], name="product_quantity_idx"),
            models.Index(fields=["updated_at"], name="product_updated_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["store", "sku"], name="product_store_sku_uniq"),
            models.UniqueConstraint(fields=["store", "serial_code"], name="product_store_barcode_uniq"),
        ]

    def __str__(self) -> str:
        return self.name


class Customer(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="customers", db_column="storeId", null=True, blank=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "Customer"
        ordering = ["name"]
        indexes = [models.Index(fields=["store"], name="customer_store_idx")]

    def __str__(self) -> str:
        return self.name


class Sale(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="sales", db_column="storeId", null=True, blank=True)
    invoice_no = models.CharField(max_length=255, db_column="invoiceNo")
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="sales", db_column="customerId")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    total = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"), db_column="amountPaid")
    payment_method = models.CharField(max_length=255, db_column="paymentMethod")
    status = models.CharField(max_length=20, choices=PaymentStatus, default=PaymentStatus.UNPAID)
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "Sale"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["store"], name="sale_store_idx"),
            models.Index(fields=["created_at"], name="sale_created_idx"),
            models.Index(fields=["customer"], name="sale_customer_idx"),
            models.Index(fields=["status"], name="sale_status_idx"),
        ]
        constraints = [models.UniqueConstraint(fields=["store", "invoice_no"], name="sale_store_invoice_uniq")]

    def __str__(self) -> str:
        return self.invoice_no


class SaleItem(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="sale_items", db_column="storeId", null=True, blank=True)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items", db_column="saleId")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items", db_column="productId")
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, db_column="unitPrice")
    total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "SaleItem"
        indexes = [
            models.Index(fields=["store"], name="saleitem_store_idx"),
            models.Index(fields=["sale"], name="saleitem_sale_idx"),
            models.Index(fields=["product"], name="saleitem_product_idx"),
        ]


class Debt(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="debts", db_column="storeId", null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="debts", db_column="customerId")
    sale = models.OneToOneField(Sale, on_delete=models.SET_NULL, blank=True, null=True, related_name="debt", db_column="saleId")
    total = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"), db_column="amountPaid")
    due_date = models.DateTimeField(db_column="dueDate")
    status = models.CharField(max_length=20, choices=DebtStatus, default=DebtStatus.CURRENT)
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "Debt"
        ordering = ["due_date"]
        indexes = [
            models.Index(fields=["store"], name="debt_store_idx"),
            models.Index(fields=["due_date"], name="debt_due_date_idx"),
            models.Index(fields=["status"], name="debt_status_idx"),
            models.Index(fields=["customer"], name="debt_customer_idx"),
        ]


class Delivery(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="deliveries", db_column="storeId", null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="deliveries", db_column="supplierId")
    product_name = models.CharField(max_length=255, db_column="productName")
    quantity = models.IntegerField()
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, db_column="costPrice")
    total = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"), db_column="amountPaid")
    delivered_at = models.DateTimeField(db_column="deliveredAt")

    class Meta:
        db_table = "Delivery"
        indexes = [models.Index(fields=["store"], name="delivery_store_idx")]


class Expense(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="expenses", db_column="storeId", null=True, blank=True)
    category = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")

    class Meta:
        db_table = "Expense"
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["store"], name="expense_store_idx"),
            models.Index(fields=["date"], name="expense_date_idx"),
            models.Index(fields=["category"], name="expense_category_idx"),
        ]


class Payment(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="payments", db_column="storeId", null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, blank=True, null=True, related_name="payments", db_column="customerId")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True, related_name="payments", db_column="supplierId")
    sale = models.ForeignKey(Sale, on_delete=models.SET_NULL, blank=True, null=True, related_name="payments", db_column="saleId")
    debt = models.ForeignKey(Debt, on_delete=models.SET_NULL, blank=True, null=True, related_name="payments", db_column="debtId")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=255)
    reference = models.CharField(max_length=255, blank=True, null=True)
    paid_at = models.DateTimeField(default=timezone.now, db_column="paidAt")

    class Meta:
        db_table = "Payment"
        indexes = [models.Index(fields=["store"], name="payment_store_idx")]


class InventoryLog(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="inventory_logs", db_column="storeId", null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="stock_logs", db_column="productId")
    type = models.CharField(max_length=255)
    quantity = models.IntegerField()
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")

    class Meta:
        db_table = "InventoryLog"
        indexes = [
            models.Index(fields=["store"], name="inventory_store_idx"),
            models.Index(fields=["product", "created_at"], name="inventory_product_date_idx"),
            models.Index(fields=["type"], name="inventory_type_idx"),
        ]


class Report(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="reports", db_column="storeId", null=True, blank=True)
    type = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    payload = models.JSONField()
    generated_by = models.CharField(max_length=255, blank=True, null=True, db_column="generatedBy")
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")

    class Meta:
        db_table = "Report"
        indexes = [models.Index(fields=["store"], name="report_store_idx")]


class Notification(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="notifications", db_column="storeId", null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=255)
    priority = models.CharField(max_length=255, default="Normal")
    read_at = models.DateTimeField(blank=True, null=True, db_column="readAt")
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")

    class Meta:
        db_table = "Notification"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["store"], name="notification_store_idx")]


class CustomerRequest(BaseModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="customer_requests", db_column="storeId", null=True, blank=True)
    product_name = models.CharField(max_length=255, db_column="productName")
    quantity = models.IntegerField()
    customer_name = models.CharField(max_length=255, blank=True, null=True, db_column="customerName")
    date_requested = models.DateField(db_column="dateRequested")
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default="Open")
    created_at = models.DateTimeField(default=timezone.now, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        db_table = "CustomerRequest"
        ordering = ["-date_requested"]
        indexes = [
            models.Index(fields=["store"], name="request_store_idx"),
            models.Index(fields=["date_requested"], name="request_date_idx"),
            models.Index(fields=["status"], name="request_status_idx"),
        ]
