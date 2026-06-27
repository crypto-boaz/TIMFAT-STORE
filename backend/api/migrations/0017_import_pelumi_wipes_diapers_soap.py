from decimal import Decimal
import re

from django.db import migrations
from django.db.models import Q
from django.db.models.deletion import ProtectedError


PRODUCTS = [
    {"id": "P-NEW-671", "category": "Pelumi", "name": "Moko Alcool Isopropylique", "barcode": "6156000058719", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-672", "category": "Pelumi", "name": "Blue Diamond 150g", "barcode": "6151100040602", "quantity": 1, "price": "1200"},
    {"id": "P-NEW-673", "category": "Pelumi", "name": "Blue Diamond 180g", "barcode": "6151100040640", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-674", "category": "Pelumi", "name": "Dorco Shaving Stick Twin Blade", "barcode": "8801038580821", "quantity": 1, "price": "600"},
    {"id": "P-NEW-675", "category": "Pelumi", "name": "Cacatin Multi Purpose Cleaner Anticeptics", "barcode": "6156000289335", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-676", "category": "Pelumi", "name": "Nail Polish", "barcode": "6975222512287", "quantity": 1, "price": "500"},
    {"id": "P-NEW-677", "category": "Pelumi", "name": "Eye Brow Shave", "barcode": "8806199416538", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-678", "category": "Pelumi", "name": "Absolut Lip Gloss", "barcode": "6977564306067", "quantity": 1, "price": "300"},
    {"id": "P-NEW-679", "category": "Pelumi", "name": "Squeezing And Shine Lip Gloss", "barcode": "6972589860013", "quantity": 1, "price": "300"},
    {"id": "P-NEW-680", "category": "Pelumi", "name": "Unique Shining Nails", "barcode": "6973444209206", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-681", "category": "Pelumi", "name": "Press On Gel Nails", "barcode": "8955155800208", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-682", "category": "Pelumi", "name": "BNN Beauty", "barcode": "6985475149525", "quantity": 1, "price": "500"},
    {"id": "P-NEW-683", "category": "Pelumi", "name": "Via Letvass Make-Up Puff", "barcode": "6972465296363", "quantity": 5, "price": "500"},
    {"id": "P-NEW-684", "category": "Pelumi", "name": "3Q Beauty", "barcode": "6975649922249", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-685", "category": "Pelumi", "name": "Sweet Kiss Gloss", "barcode": "6982725796915", "quantity": 1, "price": "1200"},
    {"id": "P-NEW-686", "category": "Pelumi", "name": "Kiss Ors", "barcode": "697727420045", "quantity": 1, "price": "700"},
    {"id": "P-NEW-687", "category": "Pelumi", "name": "Rainbow Sugar Lip Color", "barcode": "6928820466377", "quantity": 1, "price": "700"},
    {"id": "P-NEW-688", "category": "Pelumi", "name": "Primer", "barcode": "6971764193144", "quantity": 6, "price": "800"},
    {"id": "P-NEW-689", "category": "Pelumi", "name": "La Girl Face Finity Primer", "barcode": "6989632130184", "quantity": 4, "price": "700"},
    {"id": "P-NEW-690", "category": "Pelumi", "name": "HD Fitme", "barcode": "6995644345355", "quantity": 4, "price": "3000"},
    {"id": "P-NEW-691", "category": "Pelumi", "name": "Beauty Rhymes Super Matte", "barcode": "6970404401595", "quantity": 2, "price": "3500"},
    {"id": "P-NEW-692", "category": "Pelumi", "name": "Charmlook", "barcode": "6970265764853", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-693", "category": "Pelumi", "name": "Wig Cap", "barcode": "6929882040253", "quantity": 1, "price": "300"},
    {"id": "P-NEW-694", "category": "Pelumi", "name": "Fashon Fully", "barcode": "6972624957357", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-695", "category": "Pelumi", "name": "Fashon Fully", "barcode": "6972624958217", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-696", "category": "Pelumi", "name": "Green Tea", "barcode": "6972589860013", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-697", "category": "Pelumi", "name": "Super Stay", "barcode": "6903072402991", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-698", "category": "Pelumi", "name": "Aloevera", "barcode": "6972624958477", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-699", "category": "Pelumi", "name": "Tissue", "barcode": "5285001820764", "quantity": 1, "price": "300"},
    {"id": "P-NEW-700", "category": "Pelumi", "name": "Lush Relaxer", "barcode": "6154000307639", "quantity": 1, "price": "1200"},
    {"id": "P-NEW-701", "category": "WIPES / PAD", "name": "Angel Baby Wipes", "barcode": "769658790007", "quantity": 6, "price": "2000"},
    {"id": "P-NEW-702", "category": "WIPES / PAD", "name": "Kiss Kids Baby Wipes 120pcs", "barcode": "640712830245", "quantity": 6, "price": "2000"},
    {"id": "P-NEW-703", "category": "WIPES / PAD", "name": "Kid Kids Baby Wipes 10pcs", "barcode": "640712830283", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-704", "category": "WIPES / PAD", "name": "Rose Belle", "barcode": "5285001825028", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-705", "category": "WIPES / PAD", "name": "Besense Sanitary Pad 30pcs", "barcode": "608887086775", "quantity": 5, "price": "2000"},
    {"id": "P-NEW-706", "category": "WIPES / PAD", "name": "Soft Care", "barcode": "6156000349206", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-707", "category": "WIPES / PAD", "name": "My Girl", "barcode": "640712830146", "quantity": 8, "price": "2000"},
    {"id": "P-NEW-708", "category": "WIPES / PAD", "name": "Lady Care Premium", "barcode": "6951794143234", "quantity": 1, "price": "900"},
    {"id": "P-NEW-709", "category": "WIPES / PAD", "name": "Lady Care No Longer", "barcode": "745114469700", "quantity": 8, "price": "900"},
    {"id": "P-NEW-710", "category": "WIPES / PAD", "name": "My Girl", "barcode": "662476147216", "quantity": 10, "price": "1000"},
    {"id": "P-NEW-711", "category": "WIPES / PAD", "name": "Soft Care Heavy Flow", "barcode": "6156000349237", "quantity": 5, "price": "800"},
    {"id": "P-NEW-712", "category": "WIPES / PAD", "name": "Soft Care Harbal Series", "barcode": "6156000433127", "quantity": 3, "price": "800"},
    {"id": "P-NEW-713", "category": "WIPES / PAD", "name": "Dry Love", "barcode": "6921269110207", "quantity": 2, "price": "1300"},
    {"id": "P-NEW-714", "category": "WIPES / PAD", "name": "Molped", "barcode": "8690536805976", "quantity": 3, "price": "1200"},
    {"id": "P-NEW-715", "category": "WIPES / PAD", "name": "Besense Sanitary Pad", "barcode": "608887072860", "quantity": 18, "price": "300"},
    {"id": "P-NEW-716", "category": "WIPES / PAD", "name": "Soft Care", "barcode": "6156000349251", "quantity": 22, "price": "300"},
    {"id": "P-NEW-717", "category": "WIPES / PAD", "name": "Ultra Thin Pantyliners", "barcode": "5060110224951", "quantity": 4, "price": "1700"},
    {"id": "P-NEW-718", "category": "DIAPERS", "name": "Kiskid Baby Diapers Super Dry Size 3", "barcode": "608887092028", "quantity": 15, "price": "1200"},
    {"id": "P-NEW-719", "category": "DIAPERS", "name": "Kiskid Baby Diapers Size 2", "barcode": "608887092011", "quantity": 8, "price": "1200"},
    {"id": "P-NEW-720", "category": "DIAPERS", "name": "Kiskid Baby Diapers Size 4", "barcode": "608887092035", "quantity": 3, "price": "1200"},
    {"id": "P-NEW-721", "category": "SOAP", "name": "Delta", "barcode": "6156000026183", "quantity": 24, "price": "550"},
    {"id": "P-NEW-722", "category": "SOAP", "name": "Delta Plus", "barcode": "6156000026190", "quantity": 1, "price": "550"},
    {"id": "P-NEW-723", "category": "SOAP", "name": "Delta Summer Cool", "barcode": "6156000026206", "quantity": 12, "price": "550"},
    {"id": "P-NEW-724", "category": "SOAP", "name": "Delta Harbal", "barcode": "6156000026213", "quantity": 12, "price": "550"},
]


def normalize_name(value):
    return re.sub(r"\s+", " ", (value or "").strip()).casefold()


def set_product_fields(product, item, category, barcode):
    product.name = item["name"]
    product.description = "Replacement imported product list"
    product.sku = barcode
    product.serial_code = barcode
    product.category = category
    product.quantity = item["quantity"]
    product.cost_price = Decimal("0")
    product.selling_price = Decimal(item["price"])
    product.low_stock_at = 2
    product.supplier = None
    product.save()


def import_products(apps, schema_editor):
    Category = apps.get_model("api", "Category")
    Product = apps.get_model("api", "Product")
    InventoryLog = apps.get_model("api", "InventoryLog")
    SaleItem = apps.get_model("api", "SaleItem")

    batch_ids = {item["id"] for item in PRODUCTS}
    used_product_ids = set()
    seen_barcodes = set()
    for item in PRODUCTS:
        category, _ = Category.objects.get_or_create(name=item["category"])
        barcode = item["barcode"].strip() or None
        if barcode in seen_barcodes:
            barcode = None
        if barcode:
            seen_barcodes.add(barcode)

        item_name = normalize_name(item["name"])
        match_filter = Q()
        if barcode:
            match_filter |= Q(serial_code=barcode)
        excluded_ids = batch_ids | used_product_ids
        matches = list(Product.objects.exclude(id__in=excluded_ids).filter(match_filter)) if match_filter else []
        matches.extend(
            product
            for product in Product.objects.exclude(id__in=excluded_ids)
            if normalize_name(product.name) == item_name and product not in matches
        )

        product = Product.objects.filter(id=item["id"]).first()
        if product is None and matches:
            product = next((match for match in matches if SaleItem.objects.filter(product=match).exists()), matches[0])
            matches = [match for match in matches if match.id != product.id]

        for old_product in matches:
            InventoryLog.objects.filter(product=old_product).delete()
            try:
                old_product.delete()
            except ProtectedError:
                old_product.sku = None
                old_product.serial_code = None
                old_product.name = f"Replaced - {old_product.name}"
                old_product.quantity = 0
                old_product.save()

        if product is None:
            product = Product(id=item["id"])

        if barcode and Product.objects.filter(serial_code=barcode).exclude(id=product.id).exists():
            barcode = None

        InventoryLog.objects.filter(product=product).delete()
        set_product_fields(product, item, category, barcode)

        InventoryLog.objects.update_or_create(
            id=f"TX-{item['id']}",
            defaults={
                "product": product,
                "type": "Stock In",
                "quantity": item["quantity"],
                "note": "Replacement imported product list",
            },
        )
        used_product_ids.add(product.id)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0016_import_replacement_stock"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
