from decimal import Decimal

from django.db import migrations


PRODUCTS = [
    {"id": "P-NEW-491", "category": "Polish", "name": "Kiwi Black Leather", "barcode": "6001298959999", "quantity": 16, "price": "1000"},
    {"id": "P-NEW-492", "category": "Polish", "name": "Sitil Liquid Shoe Polish Brown", "barcode": "8691206060312", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-493", "category": "Polish", "name": "Sitil Shoe Polish Liquid Black", "barcode": "8691206060114", "quantity": 6, "price": "1500"},
    {"id": "P-NEW-494", "category": "Polish", "name": "Wild Wolf Liquid Shoe Polish", "barcode": "8690628411016", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-495", "category": "Body Scrub", "name": "Kuu Salt Scrub Vitamin C", "barcode": "8855140004133", "quantity": 3, "price": "3500"},
    {"id": "P-NEW-496", "category": "Body Scrub", "name": "Kuu Spa Salt Scrub Turmeric", "barcode": "8855140002290", "quantity": 2, "price": "3500"},
    {"id": "P-NEW-497", "category": "Body Scrub", "name": "Kuu Spa Salt Scrub Milk", "barcode": "8855140002252", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-498", "category": "Body Scrub", "name": "Dragon Fruit Sugar Scrub", "barcode": "6925267309939", "quantity": 5, "price": "4000"},
    {"id": "P-NEW-499", "category": "Body Scrub", "name": "Clear And Smooth Turmeric", "barcode": "8859662101424", "quantity": 1, "price": "4000"},
    {"id": "P-NEW-500", "category": "Body Scrub", "name": "X7 White Glow Spa Salt Strawberry", "barcode": "642234232422", "quantity": 2, "price": "4500"},
    {"id": "P-NEW-501", "category": "Body Scrub", "name": "Rice Sheabet Body Scrub", "barcode": "6928001840682", "quantity": 1, "price": "4000"},
    {"id": "P-NEW-502", "category": "Body Scrub", "name": "Carebeau", "barcode": "8851427002472", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-503", "category": "Body Scrub", "name": "Kojic Gluta + Body Scrub Turmeric", "barcode": "6151154321665", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-504", "category": "Body Scrub", "name": "Yoko Fresh Tomato Spa Salt", "barcode": "8853976006130", "quantity": 1, "price": "1900"},
    {"id": "P-NEW-505", "category": "Body Scrub", "name": "Yoko Papaya Spa Salt", "barcode": "8853976004181", "quantity": 2, "price": "1900"},
    {"id": "P-NEW-506", "category": "Body Scrub", "name": "Yoko Spa Milk Salt", "barcode": "8853976000800", "quantity": 5, "price": "1900"},
    {"id": "P-NEW-507", "category": "Body Scrub", "name": "Yoko Yogurt Spa Milk Salt", "barcode": "8853976004440", "quantity": 1, "price": "1900"},
    {"id": "P-NEW-508", "category": "Body Scrub", "name": "Yoko Marine Collagen Spa Salt", "barcode": "8853976005676", "quantity": 1, "price": "1900"},
    {"id": "P-NEW-509", "category": "Body Scrub", "name": "Yoko Milk Gluta Spa Salt Arbutin Goji Berry", "barcode": "8853976006932", "quantity": 1, "price": "1900"},
    {"id": "P-NEW-510", "category": "Face Mask", "name": "Zozu Collagen Fruit Lip Mask", "barcode": "6925346318456", "quantity": 1, "price": "300"},
    {"id": "P-NEW-511", "category": "Face Mask", "name": "Bioaqua Vitamin Mask", "barcode": "6942349709173", "quantity": 1, "price": "300"},
    {"id": "P-NEW-512", "category": "Face Mask", "name": "Fayankou Hyaluronic Acid Mask", "barcode": "6942349711367", "quantity": 1, "price": "300"},
    {"id": "P-NEW-513", "category": "Face Mask", "name": "Fayankou Nicotinamide Mask", "barcode": "", "quantity": 1, "price": "300"},
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
        ("api", "0011_import_home_care_stock"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
