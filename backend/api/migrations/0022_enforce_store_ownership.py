import django.db.models.deletion
from django.db import migrations, models


STORE_OWNED_MODELS = [
    "User",
    "Category",
    "Customer",
    "CustomerRequest",
    "Debt",
    "Delivery",
    "Expense",
    "InventoryLog",
    "Notification",
    "Payment",
    "Product",
    "Report",
    "Sale",
    "SaleItem",
    "Supplier",
]


def backfill_missing_stores(apps, schema_editor):
    Store = apps.get_model("api", "Store")
    Category = apps.get_model("api", "Category")
    Product = apps.get_model("api", "Product")
    legacy_store, _ = Store.objects.get_or_create(
        id="default-store",
        defaults={"store_name": "Legacy Store", "subscription_plan": "FREE"},
    )
    for category in Category.objects.filter(store__isnull=True).iterator():
        existing = Category.objects.filter(store=legacy_store, name=category.name).first()
        if existing:
            Product.objects.filter(category=category).update(category=existing)
            category.delete()
        else:
            category.store = legacy_store
            category.save(update_fields=["store"])

    for model_name in STORE_OWNED_MODELS:
        if model_name == "Category":
            continue
        model = apps.get_model("api", model_name)
        model.objects.filter(store__isnull=True).update(store=legacy_store)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0021_populate_product_slugs"),
    ]

    operations = [
        migrations.RunPython(backfill_missing_stores, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="store",
            field=models.ForeignKey(db_column="storeId", on_delete=django.db.models.deletion.PROTECT, related_name="users", to="api.store"),
        ),
        *[
            migrations.AlterField(
                model_name=model_name,
                name="store",
                field=models.ForeignKey(
                    db_column="storeId",
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name=related_name,
                    to="api.store",
                ),
            )
            for model_name, related_name in [
                ("category", "categories"),
                ("customer", "customers"),
                ("customerrequest", "customer_requests"),
                ("debt", "debts"),
                ("delivery", "deliveries"),
                ("expense", "expenses"),
                ("inventorylog", "inventory_logs"),
                ("notification", "notifications"),
                ("payment", "payments"),
                ("product", "products"),
                ("report", "reports"),
                ("sale", "sales"),
                ("saleitem", "sale_items"),
                ("supplier", "suppliers"),
            ]
        ],
    ]
