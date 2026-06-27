from decimal import Decimal

from django.db import migrations


PRODUCTS = [
    {"id": "P-NEW-514", "category": "Toiletries", "name": "X-Treme Junior Fruity Mint", "barcode": "714084869162", "quantity": 1, "price": "700"},
    {"id": "P-NEW-515", "category": "Toiletries", "name": "Close Up 35g", "barcode": "6151100134103", "quantity": 2, "price": "500"},
    {"id": "P-NEW-516", "category": "Toiletries", "name": "Close Up 140g Fresh Breath", "barcode": "6154000154660", "quantity": 8, "price": "1400"},
    {"id": "P-NEW-517", "category": "Toiletries", "name": "Close Up Complete Fresh 130g", "barcode": "6151100130730", "quantity": 6, "price": "1500"},
    {"id": "P-NEW-518", "category": "Toiletries", "name": "Close Up 130g", "barcode": "6154000013806", "quantity": 11, "price": "1300"},
    {"id": "P-NEW-519", "category": "Toiletries", "name": "Close Up 175g", "barcode": "6154000011697", "quantity": 8, "price": "1700"},
    {"id": "P-NEW-520", "category": "Toiletries", "name": "X-Treme Whitening Boost 40g", "barcode": "6152110058373", "quantity": 12, "price": "500"},
    {"id": "P-NEW-521", "category": "Toiletries", "name": "X-Treme Whitening Boost 130g", "barcode": "714084863696", "quantity": 14, "price": "1000"},
    {"id": "P-NEW-522", "category": "Toiletries", "name": "Oral Care", "barcode": "745110908692", "quantity": 10, "price": "500"},
    {"id": "P-NEW-523", "category": "Toiletries", "name": "Oral Care Plus 130g", "barcode": "745110908623", "quantity": 10, "price": "1000"},
    {"id": "P-NEW-524", "category": "Toiletries", "name": "Oral B 2 In 1 120g", "barcode": "8001841559759", "quantity": 6, "price": "2500"},
    {"id": "P-NEW-525", "category": "Toiletries", "name": "Oral B Strong Tooth 130g", "barcode": "8001090583420", "quantity": 1, "price": "2300"},
    {"id": "P-NEW-526", "category": "Toiletries", "name": "Colgate Max Fresh 120g", "barcode": "8718951579262", "quantity": 5, "price": "1500"},
    {"id": "P-NEW-527", "category": "Toiletries", "name": "Colgate Anti Cavity Tooth Paste 120g", "barcode": "8718951584600", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-528", "category": "Toiletries", "name": "Colgate Maximum Cavity Protection 130g", "barcode": "8718951704831", "quantity": 7, "price": "1500"},
    {"id": "P-NEW-529", "category": "Toiletries", "name": "Puredent 130g", "barcode": "6156000481005", "quantity": 8, "price": "1500"},
    {"id": "P-NEW-530", "category": "Toiletries", "name": "Pepsodent 120g", "barcode": "6154000011635", "quantity": 5, "price": "1500"},
    {"id": "P-NEW-531", "category": "Toiletries", "name": "Pepsodent", "barcode": "6151100130853", "quantity": 1, "price": "1400"},
    {"id": "P-NEW-532", "category": "Toiletries", "name": "Pepsodent 130g", "barcode": "6151100130754", "quantity": 6, "price": "1300"},
    {"id": "P-NEW-533", "category": "Toiletries", "name": "Pepsodent Triple Protection 123 Mega Pack 175g", "barcode": "6154000011765", "quantity": 1, "price": "1700"},
    {"id": "P-NEW-534", "category": "Toiletries", "name": "Olive", "barcode": "8993286731961", "quantity": 2, "price": "600"},
    {"id": "P-NEW-535", "category": "Toiletries", "name": "Olive Herbal 150g", "barcode": "8993286731947", "quantity": 5, "price": "700"},
    {"id": "P-NEW-536", "category": "Toiletries", "name": "Dabur Herbal 130g", "barcode": "6291069653625", "quantity": 6, "price": "1200"},
    {"id": "P-NEW-537", "category": "Toiletries", "name": "Olive 40g", "barcode": "8993286731718", "quantity": 1, "price": "400"},
]


def import_products(apps, schema_editor):
    Category = apps.get_model("api", "Category")
    Product = apps.get_model("api", "Product")
    InventoryLog = apps.get_model("api", "InventoryLog")

    seen_barcodes = set()
    for item in PRODUCTS:
        category, _ = Category.objects.get_or_create(name=item["category"])
        barcode = item["barcode"].strip() or None
        if barcode in seen_barcodes:
            barcode = None
        if barcode:
            seen_barcodes.add(barcode)

        product = Product.objects.filter(id=item["id"]).first()
        if barcode and Product.objects.filter(serial_code=barcode).exclude(id=item["id"]).exists():
            barcode = None

        defaults = {
            "name": item["name"],
            "description": "Imported product list",
            "sku": barcode,
            "serial_code": barcode,
            "category": category,
            "quantity": item["quantity"],
            "cost_price": Decimal("0"),
            "selling_price": Decimal(item["price"]),
            "low_stock_at": 2,
            "supplier": None,
        }
        if product is None:
            product = Product.objects.create(id=item["id"], **defaults)
        else:
            for field, value in defaults.items():
                setattr(product, field, value)
            product.save()

        InventoryLog.objects.update_or_create(
            id=f"TX-{item['id']}",
            defaults={
                "product": product,
                "type": "Stock In",
                "quantity": item["quantity"],
                "note": "Imported product list",
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0014_sync_local_inventory_snapshot"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
