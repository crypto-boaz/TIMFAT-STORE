import json
from unittest.mock import patch

from django.contrib.auth.models import User as AdminUser
from django.core.management import call_command
from django.test import TestCase, override_settings

from .models import Category, CustomerRequest, Debt, Expense, Product, Sale, Supplier, User


class BusinessDataTests(TestCase):
    def test_put_saves_frontend_data_into_django_tables(self):
        register_response = self.client.post(
            "/api/auth/register",
            data=json.dumps({
                "username": "newstaff",
                "name": "Sales Staff",
                "email": "new.staff@kingsstore.local",
                "password": "password123",
                "role": "STAFF",
            }),
            content_type="application/json",
        )
        self.assertEqual(register_response.status_code, 201)
        token = register_response.json()["token"]

        payload = {
            "products": [{"id": "P-1", "serialCode": "SN-1", "name": "Acetone", "category": "Solvent", "quantity": 4, "unitPrice": 1000, "costPrice": 700}],
            "sales": [{"id": "INV-1", "customer": "Walk-in Customer", "total": 1000, "paid": 1000, "status": "Paid", "method": "Cash", "date": "2026-06-05"}],
            "debts": [{"id": "D-1", "customer": "Walk-in Customer", "total": 500, "paid": 0, "status": "Current", "dueDate": "2026-06-12"}],
            "expenses": [{"id": "EXP-1", "amount": 250, "category": "Transport", "description": "Delivery", "date": "2026-06-05"}],
            "suppliers": [{"id": "SUP-1", "name": "Main Supplier", "product": "Acetone", "quantity": 3, "costPrice": 700, "total": 2100, "paid": 1000, "deliveryDate": "2026-06-05"}],
            "customerRequests": [{"id": "REQ-1", "productName": "Beaker", "quantity": 2, "dateRequested": "2026-06-05", "status": "Open"}],
            "cart": [{"productId": "P-1", "quantity": 1}],
        }

        response = self.client.put(
            "/api/business-data",
            data=json.dumps({"data": payload}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Product.objects.filter(id="P-1", name="Acetone").exists())
        self.assertEqual(Sale.objects.filter(invoice_no="INV-1").count(), 1)
        self.assertEqual(Debt.objects.filter(id="D-1").count(), 1)
        self.assertEqual(Expense.objects.filter(id="EXP-1").count(), 1)
        self.assertEqual(Supplier.objects.filter(id="SUP-1").count(), 1)
        self.assertEqual(CustomerRequest.objects.filter(id="REQ-1").count(), 1)

        response = self.client.get("/api/business-data", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertTrue(any(item["name"] == "Acetone" for item in data["products"]))
        self.assertEqual(data["sales"][0]["id"], "INV-1")
    def test_product_sync_saves_single_frontend_product(self):
        register_response = self.client.post(
            "/api/auth/register",
            data=json.dumps({
                "username": "productadmin",
                "name": "Product Admin",
                "email": "product.admin@kingsstore.local",
                "password": "password123",
                "role": "WAREHOUSE",
            }),
            content_type="application/json",
        )
        token = register_response.json()["token"]

        response = self.client.post(
            "/api/products/sync",
            data=json.dumps({
                "id": "P-front-1",
                "serialCode": "SYNC-001",
                "name": "Church Scent",
                "category": "Fragrance",
                "quantity": 2,
                "unitPrice": 3000,
                "lowStockAt": 1,
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 201)
        product = Product.objects.get(serial_code="SYNC-001")
        self.assertEqual(product.name, "Church Scent")
        self.assertEqual(product.category.name, "Fragrance")
        self.assertEqual(product.quantity, 2)
        self.assertEqual(product.selling_price, 3000)
    def test_products_bulk_sync_creates_updates_and_reports_bad_rows(self):
        register_response = self.client.post(
            "/api/auth/register",
            data=json.dumps({
                "username": "bulkwarehouse",
                "name": "Bulk Warehouse",
                "email": "bulk.warehouse@kingsstore.local",
                "password": "password123",
                "role": "WAREHOUSE",
            }),
            content_type="application/json",
        )
        token = register_response.json()["token"]
        category = Category.objects.create(name="Cosmetics")
        Product.objects.create(
            id="P-existing-bulk",
            serial_code="7201924767",
            sku="7201924767",
            name="Old Kojic White",
            category=category,
            quantity=1,
            selling_price=1000,
        )

        response = self.client.post(
            "/api/products/bulk-sync",
            data=json.dumps({
                "products": [
                    {
                        "id": "P-local-kojic",
                        "serialCode": "7201924767",
                        "name": "KOJIC WHITE",
                        "category": "Cosmetics",
                        "quantity": 3,
                        "unitPrice": 2500,
                        "lowStockAt": 1,
                    },
                    {
                        "id": "P-des-shower",
                        "serialCode": "XLS-NEW-001",
                        "name": "DES SHOWER GEL",
                        "category": "Cosmetics",
                        "quantity": 0,
                        "unitPrice": 0,
                        "lowStockAt": 20,
                    },
                    {"serialCode": "BAD-ROW"},
                ]
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["created"], 1)
        self.assertEqual(body["updated"], 1)
        self.assertEqual(body["skipped"], 1)
        self.assertEqual(Product.objects.filter(serial_code="7201924767").count(), 1)
        self.assertEqual(Product.objects.get(serial_code="7201924767").name, "KOJIC WHITE")
        self.assertTrue(Product.objects.filter(serial_code="XLS-NEW-001", name="DES SHOWER GEL").exists())
    def test_put_updates_existing_product_when_barcode_matches_different_id(self):
        register_response = self.client.post(
            "/api/auth/register",
            data=json.dumps({
                "username": "warehouse",
                "name": "Warehouse Staff",
                "email": "warehouse@kingsstore.local",
                "password": "password123",
                "role": "WAREHOUSE",
            }),
            content_type="application/json",
        )
        token = register_response.json()["token"]
        category = Category.objects.create(name="Cosmetics")
        Product.objects.create(
            id="P-existing",
            serial_code="7201924767",
            sku="7201924767",
            name="Old Kojic White",
            category=category,
            quantity=1,
            selling_price=1000,
        )

        response = self.client.put(
            "/api/business-data",
            data=json.dumps({
                "data": {
                    "products": [{
                        "id": "P-local-new-id",
                        "serialCode": "7201924767",
                        "name": "KOJIC WHITE",
                        "category": "Cosmetics",
                        "quantity": 3,
                        "unitPrice": 2500,
                        "lowStockAt": 1,
                        "transactionHistory": [],
                    }],
                    "categories": ["Cosmetics"],
                    "sales": [],
                    "debts": [],
                    "expenses": [],
                    "suppliers": [],
                    "customerRequests": [],
                    "cart": [],
                }
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Product.objects.filter(serial_code="7201924767").count(), 1)
        product = Product.objects.get(serial_code="7201924767")
        self.assertEqual(product.id, "P-existing")
        self.assertEqual(product.name, "KOJIC WHITE")
        self.assertEqual(product.quantity, 3)
        self.assertEqual(product.selling_price, 2500)

    def test_business_data_requires_authentication(self):
        response = self.client.get("/api/business-data")
        self.assertEqual(response.status_code, 401)

    @override_settings(REGISTRATION_ENABLED=True)
    def test_frontend_login_accepts_django_superuser_username(self):
        admin = AdminUser.objects.create_user(username="owner", email="owner@kingsstore.local", password="StrongPass12345")
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": "owner", "password": "StrongPass12345"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("token", body)
        self.assertEqual(body["user"]["username"], "owner")
        self.assertEqual(body["user"]["role"], "ADMIN")
        self.assertTrue(User.objects.filter(username="owner", role="ADMIN").exists())

    def test_bootstrap_admin_reuses_existing_paytrack_user_by_email(self):
        User.objects.create(
            username="oldadmin",
            name="Old Admin",
            email="owner@kingsstore.local",
            password_hash="unused",
            role="STAFF",
            active=True,
        )

        with patch.dict("os.environ", {
            "PAYTRACK_ADMIN_EMAIL": "owner@kingsstore.local",
            "PAYTRACK_ADMIN_NAME": "Owner Admin",
            "PAYTRACK_ADMIN_PASSWORD": "StrongPass12345",
            "DJANGO_SUPERUSER_USERNAME": "owner",
        }, clear=False):
            call_command("bootstrap_admin")

        self.assertEqual(User.objects.filter(email="owner@kingsstore.local").count(), 1)
        app_user = User.objects.get(email="owner@kingsstore.local")
        self.assertEqual(app_user.username, "owner")
        self.assertEqual(app_user.name, "Owner Admin")
        self.assertEqual(app_user.role, "ADMIN")
        self.assertTrue(AdminUser.objects.get(username="owner").check_password("StrongPass12345"))
