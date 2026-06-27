from decimal import Decimal

from django.db import migrations


PRODUCTS = [
    {"id": "P-NEW-406", "category": "Air Freshener", "name": "Air Freshener Fresh Vanilla", "barcode": "6959259202175", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-407", "category": "Air Freshener", "name": "Air Freshener Strawberry", "barcode": "6959259201970", "quantity": 1, "price": "0"},
    {"id": "P-NEW-408", "category": "Air Freshener", "name": "Air Wick Rose", "barcode": "6151100282354", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-409", "category": "Air Freshener", "name": "Wind Air Freshener Floral Oud", "barcode": "5285002324544", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-410", "category": "Air Freshener", "name": "Wind Air Freshener Summer Breeze", "barcode": "5285002322236", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-411", "category": "Air Freshener", "name": "Todakekay Air Freshener Strawberry", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-412", "category": "Air Freshener", "name": "Wind Air Freshener Campestre", "barcode": "5285002322243", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-413", "category": "Air Freshener", "name": "Wind Air Freshener Wild Flower", "barcode": "5285002323783", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-414", "category": "Air Freshener", "name": "Wind Air Freshener Forest", "barcode": "5285002323776", "quantity": 3, "price": "2500"},
    {"id": "P-NEW-415", "category": "Air Freshener", "name": "Wind Air Freshener Wild Flower 150G", "barcode": "5285002323608", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-416", "category": "Air Freshener", "name": "Wind Air Freshener Wild Flower 50G", "barcode": "5285002323615", "quantity": 3, "price": "700"},
    {"id": "P-NEW-417", "category": "Air Freshener", "name": "Wind Air Freshener Summer Breeze 150G", "barcode": "5285002320751", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-418", "category": "Air Freshener", "name": "Wind Air Freshener Mistral 150G", "barcode": "5285002320676", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-419", "category": "Air Freshener", "name": "Wind Air Freshener Forest 150G", "barcode": "5285002323622", "quantity": 6, "price": "1500"},
    {"id": "P-NEW-420", "category": "Air Freshener", "name": "Wind Air Freshener Floral Oud 50G", "barcode": "5285002324469", "quantity": 3, "price": "700"},
    {"id": "P-NEW-421", "category": "Air Freshener", "name": "Wind Air Freshener Campestre 50G", "barcode": "5285002320683", "quantity": 1, "price": "700"},
    {"id": "P-NEW-422", "category": "Air Freshener", "name": "Wind Air Freshener Summer Breeze 50G", "barcode": "5285002320744", "quantity": 4, "price": "700"},
    {"id": "P-NEW-423", "category": "Air Freshener", "name": "Wind Air Freshener Forest", "barcode": "5285002323639", "quantity": 5, "price": "700"},
    {"id": "P-NEW-424", "category": "Air Freshener", "name": "Wind Air Freshener Strawberry 35G", "barcode": "5285002324384", "quantity": 1, "price": "300"},
    {"id": "P-NEW-425", "category": "Air Freshener", "name": "Sun Shine Air Freshener Gel Strawberry", "barcode": "6151100040442", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-426", "category": "Air Freshener", "name": "Sun Shine Lavande", "barcode": "6151100040220", "quantity": 1, "price": "500"},
    {"id": "P-NEW-427", "category": "Air Freshener", "name": "Sun Shine Jasmin", "barcode": "6151100040213", "quantity": 1, "price": "500"},
    {"id": "P-NEW-428", "category": "Air Freshener", "name": "Sun Shine Musk", "barcode": "6151100040244", "quantity": 12, "price": "500"},
    {"id": "P-NEW-429", "category": "Air Freshener", "name": "Stova", "barcode": "6156000227580", "quantity": 1, "price": "400"},
    {"id": "P-NEW-430", "category": "Air Freshener", "name": "Air Wick Peach And Jasmine", "barcode": "6009695933741", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-431", "category": "Air Freshener", "name": "Air Wick Lavander", "barcode": "6009695933727", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-432", "category": "Air Freshener", "name": "Wind Air Freshener Mistral", "barcode": "5285002322229", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-433", "category": "Air Freshener", "name": "Swiss Flower Tangerine 500ML", "barcode": "6154000107000", "quantity": 26, "price": "1400"},
    {"id": "P-NEW-434", "category": "Air Freshener", "name": "Swiss Tangerine 250ML", "barcode": "6154000107017", "quantity": 5, "price": "900"},
    {"id": "P-NEW-435", "category": "Air Freshener", "name": "Swiss Sweetpine 250ML", "barcode": "6154000107680", "quantity": 12, "price": "900"},
    {"id": "P-NEW-436", "category": "Air Freshener", "name": "Super Glue", "barcode": "6937042509021", "quantity": 1, "price": "200"},
    {"id": "P-NEW-437", "category": "Insecticide", "name": "Boxer", "barcode": "6935068220326", "quantity": 3, "price": "3500"},
    {"id": "P-NEW-438", "category": "Insecticide", "name": "BCN Mosquito Spray", "barcode": "7935182101845", "quantity": 3, "price": "3500"},
    {"id": "P-NEW-439", "category": "Insecticide", "name": "Mr Gecko", "barcode": "6487915334842", "quantity": 4, "price": "3500"},
    {"id": "P-NEW-440", "category": "Insecticide", "name": "Raid A Dream", "barcode": "6933335520315", "quantity": 3, "price": "4000"},
    {"id": "P-NEW-441", "category": "Insecticide", "name": "Sniper 300ML", "barcode": "6154000113070", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-442", "category": "Insecticide", "name": "Sniper Multi Purpose Insect Killer", "barcode": "6154000113018", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-443", "category": "Insecticide", "name": "Sniper Crawling Insect Killer", "barcode": "6154000113155", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-444", "category": "Insecticide", "name": "Sniper Bedbug 220ML", "barcode": "6156000024202", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-445", "category": "Insecticide", "name": "Sniper DDVP 200ML", "barcode": "6154000113667", "quantity": 2, "price": "4500"},
    {"id": "P-NEW-446", "category": "Insecticide", "name": "Slap Multi Insect Killer", "barcode": "6156000433806", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-447", "category": "Insecticide", "name": "Mr Gecko Ocean Fragrance 300ML", "barcode": "7951834117132", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-448", "category": "Insecticide", "name": "Mr Gecko Lemon Fragrance 300ML", "barcode": "7951834116135", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-449", "category": "Insecticide", "name": "Raid 300ML", "barcode": "5010182974612", "quantity": 2, "price": "3300"},
    {"id": "P-NEW-450", "category": "Insecticide", "name": "Bagon 300ML", "barcode": "5010182990193", "quantity": 2, "price": "3300"},
    {"id": "P-NEW-451", "category": "Insecticide", "name": "Good Knight 120ML", "barcode": "6154000086527", "quantity": 3, "price": "2800"},
    {"id": "P-NEW-452", "category": "Insecticide", "name": "Good Knight Power Active", "barcode": "6154000320164", "quantity": 2, "price": "3000"},
    {"id": "P-NEW-453", "category": "Insecticide", "name": "Powder Cockroach Killer", "barcode": "6975627620013", "quantity": 1, "price": "200"},
    {"id": "P-NEW-454", "category": "Insecticide", "name": "BCN Coils", "barcode": "735745592250", "quantity": 3, "price": "500"},
    {"id": "P-NEW-455", "category": "Insecticide", "name": "Ranbo Mosquito Coil", "barcode": "5060148951881", "quantity": 1, "price": "500"},
    {"id": "P-NEW-456", "category": "Insecticide", "name": "Z Germicide", "barcode": "5060148950952", "quantity": 8, "price": "1000"},
    {"id": "P-NEW-457", "category": "Insecticide", "name": "Vianna Mouse Glue Trap Board", "barcode": "6972976001128", "quantity": 17, "price": "500"},
    {"id": "P-NEW-458", "category": "Liquid Washes", "name": "Car Wash Super Concentrate Wash And Wax", "barcode": "6034000081244", "quantity": 3, "price": "3000"},
    {"id": "P-NEW-459", "category": "Liquid Washes", "name": "Easy On", "barcode": "062338002156", "quantity": 3, "price": "3500"},
    {"id": "P-NEW-460", "category": "Liquid Washes", "name": "Glass Cleaner", "barcode": "6154000332112", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-461", "category": "Liquid Washes", "name": "Jik", "barcode": "6151100282071", "quantity": 3, "price": "1900"},
    {"id": "P-NEW-462", "category": "Liquid Washes", "name": "Detol 75ML", "barcode": "6151100281852", "quantity": 6, "price": "1700"},
    {"id": "P-NEW-463", "category": "Liquid Washes", "name": "Hypo Multi Purpose Bleach 500ML", "barcode": "6156000039619", "quantity": 3, "price": "1700"},
    {"id": "P-NEW-464", "category": "Liquid Washes", "name": "Hypo Multi Purpose Bleach 1L", "barcode": "6156000039626", "quantity": 2, "price": "2900"},
    {"id": "P-NEW-465", "category": "Liquid Washes", "name": "Hypo Multi Purpose Bleach 1.5L", "barcode": "6156000039688", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-466", "category": "Liquid Washes", "name": "Hypo Toilet Cleaner Floral", "barcode": "630902411712", "quantity": 2, "price": "3000"},
    {"id": "P-NEW-467", "category": "Liquid Washes", "name": "Hypo Toilet Cleaner 5 In 1", "barcode": "6156000255804", "quantity": 2, "price": "4000"},
    {"id": "P-NEW-468", "category": "Liquid Washes", "name": "Hypo Toilet Cleaner Lavander 5 In 1", "barcode": "630902411729", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-469", "category": "Liquid Washes", "name": "Harpic 725ML", "barcode": "6151100282729", "quantity": 5, "price": "4300"},
    {"id": "P-NEW-470", "category": "Liquid Washes", "name": "Harpic 450ML", "barcode": "6151100282712", "quantity": 1, "price": "3300"},
    {"id": "P-NEW-471", "category": "Liquid Washes", "name": "Harpic 200ML", "barcode": "6151100282705", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-472", "category": "Liquid Washes", "name": "Toilet Cleaner 500ML", "barcode": "6154000251109", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-473", "category": "Liquid Washes", "name": "Dettol 165ML", "barcode": "6151100281869", "quantity": 6, "price": "3500"},
    {"id": "P-NEW-474", "category": "Liquid Washes", "name": "Mama Lemon 1100ML", "barcode": "9259932005329", "quantity": 1, "price": "2400"},
    {"id": "P-NEW-475", "category": "Liquid Washes", "name": "Mama Lemon 550ML", "barcode": "9259932002328", "quantity": 2, "price": "1400"},
    {"id": "P-NEW-476", "category": "Liquid Washes", "name": "Mama Lemon 250ML", "barcode": "9259932001239", "quantity": 3, "price": "800"},
    {"id": "P-NEW-477", "category": "Liquid Washes", "name": "2Sure Fresh Lemon 250ML", "barcode": "6151100150882", "quantity": 4, "price": "800"},
    {"id": "P-NEW-478", "category": "Liquid Washes", "name": "2 Sure Original Dish Washing 250ML", "barcode": "6151100151049", "quantity": 1, "price": "800"},
    {"id": "P-NEW-479", "category": "Liquid Washes", "name": "Morning Fresh Medium", "barcode": "6154000018092", "quantity": 4, "price": "900"},
    {"id": "P-NEW-480", "category": "Liquid Washes", "name": "Morning Fresh Big Zesty Lemon", "barcode": "6154000018139", "quantity": 6, "price": "1700"},
    {"id": "P-NEW-481", "category": "Liquid Washes", "name": "Morning Fresh 1000ML", "barcode": "6154000018078", "quantity": 5, "price": "3400"},
    {"id": "P-NEW-482", "category": "Perfume", "name": "Veyes Reed Diffuser Melon", "barcode": "6939517150714", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-483", "category": "Perfume", "name": "Veyes Reed Diffuser Coffee", "barcode": "6939517150820", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-484", "category": "Perfume", "name": "Veyes Reed Diffuser Coconut", "barcode": "6939517151148", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-485", "category": "Perfume", "name": "Veyes Reed Diffuser Lilac", "barcode": "6939517150813", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-486", "category": "Perfume", "name": "Veyes Reed Diffuser Angel", "barcode": "6939517150783", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-487", "category": "Perfume", "name": "Veyes Reed Diffuser Blue Berry", "barcode": "6939517150844", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-488", "category": "Perfume", "name": "Veyes Reed Diffuser Tree", "barcode": "6939517150790", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-489", "category": "Toiletries", "name": "Personal Cotton Bud", "barcode": "6976808771807", "quantity": 6, "price": "800"},
    {"id": "P-NEW-490", "category": "Toiletries", "name": "Baby Cherie", "barcode": "6976808770909", "quantity": 16, "price": "1000"},
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
        ("api", "0010_import_perfume_lotion_stock"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
