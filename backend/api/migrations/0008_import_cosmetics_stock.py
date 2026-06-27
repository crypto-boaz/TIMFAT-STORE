from decimal import Decimal

from django.db import migrations


PRODUCTS = [
    {"id": "P-NEW-001", "category": "Lotions", "name": "Serial White 3x Extra Whitening", "barcode": "6154000257248", "quantity": 2, "price": "4000"},
    {"id": "P-NEW-002", "category": "Lotions", "name": "Serial White Exclusive Lightening Milk", "barcode": "615400257132", "quantity": 2, "price": "4000"},
    {"id": "P-NEW-003", "category": "Lotions", "name": "Serial White Gold", "barcode": "6154000257019", "quantity": 4, "price": "4000"},
    {"id": "P-NEW-004", "category": "Lotions", "name": "Almond White Pure Carrot + Vitamin C", "barcode": "6291476455232", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-005", "category": "Lotions", "name": "Beauty Secret Perfect Glow", "barcode": "0033580333817", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-006", "category": "Lotions", "name": "Addley Whitening Carrot Extract", "barcode": "0280985080956", "quantity": 3, "price": "3500"},
    {"id": "P-NEW-007", "category": "Lotions", "name": "White Expert Glutathione Injection", "barcode": "0126711022305", "quantity": 2, "price": "4000"},
    {"id": "P-NEW-008", "category": "Lotions", "name": "White Expert Glutathione Injection Terminal White + Gluta Carrot White", "barcode": "0126711022008", "quantity": 2, "price": "4000"},
    {"id": "P-NEW-009", "category": "Lotions", "name": "Dulce Papaya", "barcode": "8858854605641", "quantity": 1, "price": "4000"},
    {"id": "P-NEW-010", "category": "Lotions", "name": "Paris Body Clinic Papaya", "barcode": "2038791752745", "quantity": 2, "price": "5000"},
    {"id": "P-NEW-011", "category": "Lotions", "name": "Paris Body Clinic Carrot Glow 3x Skin Glow", "barcode": "2038791752622", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-012", "category": "Lotions", "name": "Glutat Winky White", "barcode": "8859337600910", "quantity": 2, "price": "4000"},
    {"id": "P-NEW-013", "category": "Lotions", "name": "Gluta Winky White Egyptian Milk", "barcode": "8859337600910", "quantity": 2, "price": "4000"},
    {"id": "P-NEW-014", "category": "Lotions", "name": "Roushun Brand Quality Vitamin C", "barcode": "6921199113624", "quantity": 2, "price": "7000"},
    {"id": "P-NEW-015", "category": "Lotions", "name": "Skin Doctor Paris 5.5", "barcode": "7056348623411", "quantity": 1, "price": "9500"},
    {"id": "P-NEW-016", "category": "Lotions", "name": "Roushun Niacinamide 5.5+ Hyaluronic Acid", "barcode": "692119138678", "quantity": 1, "price": "8000"},
    {"id": "P-NEW-017", "category": "Lotions", "name": "Medix 5.5", "barcode": "810400030527", "quantity": 2, "price": "18000"},
    {"id": "P-NEW-018", "category": "Lotions", "name": "Pro+ White Half Cast 24k Gold", "barcode": "", "quantity": 1, "price": "8000"},
    {"id": "P-NEW-019", "category": "Lotions", "name": "Sadoer Vitamin C Turmeric", "barcode": "6942349739224", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-020", "category": "Lotions", "name": "Roushun Brand Quality Retinol 5.5", "barcode": "6921199138661", "quantity": 1, "price": "8000"},
    {"id": "P-NEW-021", "category": "Lotions", "name": "Argan+ 5 Oil Blend", "barcode": "6532140014020", "quantity": 1, "price": "8000"},
    {"id": "P-NEW-022", "category": "Lotions", "name": "Visisle Solution Skin Active 50+", "barcode": "2456903213456", "quantity": 1, "price": "11000"},
    {"id": "P-NEW-023", "category": "Lotions", "name": "Fair And White Paris Miss White Carrot", "barcode": "877917004694", "quantity": 2, "price": "5000"},
    {"id": "P-NEW-024", "category": "Lotions", "name": "White Glow Toning & Glowing Body Milk Lotion", "barcode": "6936217747053", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-025", "category": "Lotions", "name": "White Glow Brightening & Glowing", "barcode": "6936217747060", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-026", "category": "Lotions", "name": "Blooming Bouquet", "barcode": "6936217747053", "quantity": 1, "price": "0"},
    {"id": "P-NEW-027", "category": "Lotions", "name": "Melanine White", "barcode": "6186001073145", "quantity": 2, "price": "3500"},
    {"id": "P-NEW-028", "category": "Lotions", "name": "Carotone Lotion", "barcode": "6182000100486", "quantity": 3, "price": "0"},
    {"id": "P-NEW-029", "category": "Lotions", "name": "CT Plus Clear Therapy Lotion", "barcode": "6181100533279", "quantity": 8, "price": "3500"},
    {"id": "P-NEW-030", "category": "Lotions", "name": "Gluta Touch Lotion", "barcode": "6181100383256", "quantity": 3, "price": "2500"},
    {"id": "P-NEW-031", "category": "Lotions", "name": "Booster Clear Lotion", "barcode": "6181100385021", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-032", "category": "Soaps", "name": "Day By Day Soap", "barcode": "6156000185224", "quantity": 7, "price": "1000"},
    {"id": "P-NEW-033", "category": "Soaps", "name": "Fresh Glow 2 In 1 Soap", "barcode": "6156000060279", "quantity": 13, "price": "700"},
    {"id": "P-NEW-034", "category": "Soaps", "name": "Carro Fresh Soap", "barcode": "6600427109948", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-035", "category": "Soaps", "name": "Eva Cherry", "barcode": "6154000269272", "quantity": 11, "price": "700"},
    {"id": "P-NEW-036", "category": "Soaps", "name": "Eva Gold", "barcode": "6154000269203", "quantity": 8, "price": "700"},
    {"id": "P-NEW-037", "category": "Soaps", "name": "Eva Frais", "barcode": "6154000269265", "quantity": 13, "price": "700"},
    {"id": "P-NEW-038", "category": "Soaps", "name": "Eva Moringa", "barcode": "6154000269258", "quantity": 20, "price": "700"},
    {"id": "P-NEW-039", "category": "Soaps", "name": "Tura", "barcode": "6156000060118", "quantity": 4, "price": "500"},
    {"id": "P-NEW-040", "category": "Soaps", "name": "Siri Forever Young", "barcode": "0745110908241", "quantity": 39, "price": "700"},
    {"id": "P-NEW-041", "category": "Soaps", "name": "Jam Rice Milk Soap", "barcode": "8858891600715", "quantity": 6, "price": "800"},
    {"id": "P-NEW-042", "category": "Soaps", "name": "Jam Rice Milk With Vitamin C Soap", "barcode": "", "quantity": 8, "price": "800"},
    {"id": "P-NEW-043", "category": "Soaps", "name": "Jam Acne Soap", "barcode": "8857122751622", "quantity": 7, "price": "800"},
    {"id": "P-NEW-044", "category": "Soaps", "name": "Jam Tomato", "barcode": "8858891602900", "quantity": 8, "price": "800"},
    {"id": "P-NEW-045", "category": "Soaps", "name": "Jam Carrot", "barcode": "885712751059", "quantity": 3, "price": "800"},
    {"id": "P-NEW-046", "category": "Soaps", "name": "Jam Goat Milk", "barcode": "8857122751974", "quantity": 3, "price": "800"},
    {"id": "P-NEW-047", "category": "Soaps", "name": "Lux Creamy Perfection", "barcode": "6221155041722", "quantity": 5, "price": "1300"},
    {"id": "P-NEW-048", "category": "Soaps", "name": "Dudu-Osun Black Soap", "barcode": "6156000043821", "quantity": 16, "price": "1000"},
    {"id": "P-NEW-049", "category": "Soaps", "name": "Premier Cool", "barcode": "6151100310002", "quantity": 24, "price": "450"},
    {"id": "P-NEW-050", "category": "Soaps", "name": "Dettol Cool", "barcode": "6151100282118", "quantity": 20, "price": "0"},
    {"id": "P-NEW-051", "category": "Soaps", "name": "Dettol Cool Big", "barcode": "6151100281395", "quantity": 11, "price": "0"},
    {"id": "P-NEW-052", "category": "Soaps", "name": "Dettol Skin Care", "barcode": "6151100283429", "quantity": 12, "price": "0"},
    {"id": "P-NEW-053", "category": "Soaps", "name": "Dettol Original 12hrs", "barcode": "6151100282880", "quantity": 6, "price": "0"},
    {"id": "P-NEW-054", "category": "Soaps", "name": "Dettol Original 12hrs Small", "barcode": "6151100282828", "quantity": 5, "price": "0"},
    {"id": "P-NEW-055", "category": "Soaps", "name": "Meriko", "barcode": "5028929004027", "quantity": 11, "price": "800"},
    {"id": "P-NEW-056", "category": "Soaps", "name": "Crusader", "barcode": "", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-057", "category": "Soaps", "name": "Classic White Soap", "barcode": "8993286421206", "quantity": 5, "price": "480"},
    {"id": "P-NEW-058", "category": "Soaps", "name": "Premier Care Natural", "barcode": "6151100310408", "quantity": 17, "price": "800"},
    {"id": "P-NEW-059", "category": "Soaps", "name": "Viva Plus", "barcode": "0705632130162", "quantity": 12, "price": "800"},
    {"id": "P-NEW-060", "category": "Soaps", "name": "Tetmosol", "barcode": "6009826820018", "quantity": 23, "price": "500"},
    {"id": "P-NEW-061", "category": "Soaps", "name": "Premium Blue Berry", "barcode": "6154000473013", "quantity": 4, "price": "700"},
    {"id": "P-NEW-062", "category": "Soaps", "name": "Classy Soft And Gentle", "barcode": "5065014005705", "quantity": 5, "price": "700"},
    {"id": "P-NEW-063", "category": "Soaps", "name": "Classy", "barcode": "5065014005231", "quantity": 6, "price": "700"},
    {"id": "P-NEW-064", "category": "Soaps", "name": "Premium Tangerine", "barcode": "", "quantity": 5, "price": "700"},
    {"id": "P-NEW-065", "category": "Soaps", "name": "Canoe", "barcode": "", "quantity": 5, "price": "500"},
    {"id": "P-NEW-066", "category": "Soaps", "name": "Cussons Baby Soft & Smooth", "barcode": "6154000017019", "quantity": 12, "price": "500"},
    {"id": "P-NEW-067", "category": "Soaps", "name": "Cussons Baby Mild & Gentle", "barcode": "154000018658", "quantity": 6, "price": "500"},
    {"id": "P-NEW-068", "category": "Soaps", "name": "Septol", "barcode": "5051575000877", "quantity": 2, "price": "400"},
    {"id": "P-NEW-069", "category": "Powder", "name": "Passion Talcum Powder 200g", "barcode": "5285002321833", "quantity": 7, "price": "800"},
    {"id": "P-NEW-070", "category": "Powder", "name": "Passion Powder 500g", "barcode": "5285002322144", "quantity": 1, "price": "1800"},
    {"id": "P-NEW-071", "category": "Powder", "name": "Passion Powder 90g", "barcode": "5285002321840", "quantity": 2, "price": "500"},
    {"id": "P-NEW-072", "category": "Powder", "name": "Passion Powder 25g", "barcode": "5285002321826", "quantity": 1, "price": "300"},
    {"id": "P-NEW-073", "category": "Powder", "name": "My Love", "barcode": "6156000231211", "quantity": 3, "price": "500"},
    {"id": "P-NEW-074", "category": "Powder", "name": "Harmaderm Anti Bacteria", "barcode": "6154000071318", "quantity": 4, "price": "1000"},
    {"id": "P-NEW-075", "category": "Powder", "name": "Get Me", "barcode": "3551440203096", "quantity": 4, "price": "500"},
    {"id": "P-NEW-076", "category": "Powder", "name": "Harmaderi Anti-Bacteria Big", "barcode": "618110045433815", "quantity": 3, "price": "2500"},
    {"id": "P-NEW-077", "category": "Powder", "name": "Racing Baby Powder Small", "barcode": "6156000027708", "quantity": 3, "price": "700"},
    {"id": "P-NEW-078", "category": "Powder", "name": "Racing Baby Powder Big", "barcode": "6156000027722", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-079", "category": "Powder", "name": "Damatal", "barcode": "6156000118253", "quantity": 4, "price": "2600"},
    {"id": "P-NEW-080", "category": "Powder", "name": "Medi Care", "barcode": "6154000096854", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-081", "category": "Powder", "name": "Imperio Baby And Me", "barcode": "0756000043546", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-082", "category": "Powder", "name": "Mom & Baby", "barcode": "3551440201375", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-083", "category": "Powder", "name": "Imperio New Formula", "barcode": "92181128215423", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-084", "category": "Liquid Baby Wash", "name": "Dodo Skin Gold Shower Gel", "barcode": "61540062863", "quantity": 1, "price": "7000"},
    {"id": "P-NEW-085", "category": "Liquid Baby Wash", "name": "K Brothers", "barcode": "8853252008957", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-086", "category": "Liquid Baby Wash", "name": "Des S.S Shower Gel", "barcode": "480011921307", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-087", "category": "Liquid Baby Wash", "name": "Disaar Shower Gel", "barcode": "480011921307", "quantity": 6, "price": "2500"},
    {"id": "P-NEW-088", "category": "Liquid Baby Wash", "name": "Lightup", "barcode": "6181100322278", "quantity": 6, "price": "2500"},
    {"id": "P-NEW-089", "category": "Liquid Baby Wash", "name": "Fair Child", "barcode": "", "quantity": 12, "price": "4500"},
    {"id": "P-NEW-090", "category": "Liquid Baby Wash", "name": "Pretty Angels", "barcode": "", "quantity": 5, "price": "4500"},
    {"id": "P-NEW-091", "category": "Cup Creams", "name": "Medi Care Skin Tone", "barcode": "6156000016955", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-092", "category": "Cup Creams", "name": "MediCare Perfect Moisturizing", "barcode": "6156000016955", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-093", "category": "Cup Creams", "name": "Cocoderm", "barcode": "6181100324150", "quantity": 1, "price": "0"},
    {"id": "P-NEW-094", "category": "Cup Creams", "name": "Carotone Cup Cream", "barcode": "6182000132272", "quantity": 6, "price": "3000"},
    {"id": "P-NEW-095", "category": "Cup Creams", "name": "Carro White 120ml", "barcode": "6181100530063", "quantity": 8, "price": "1400"},
    {"id": "P-NEW-096", "category": "Cup Creams", "name": "Carro White 300ml", "barcode": "6181100530056", "quantity": 3, "price": "2900"},
    {"id": "P-NEW-097", "category": "Cup Creams", "name": "Yellow Paw", "barcode": "615400364960", "quantity": 4, "price": "1800"},
    {"id": "P-NEW-098", "category": "Cup Creams", "name": "Carrotone 3 In 1", "barcode": "6182000100486", "quantity": 6, "price": "1400"},
    {"id": "P-NEW-099", "category": "Cup Creams", "name": "Clair Liss", "barcode": "6181100320312", "quantity": 5, "price": "1400"},
    {"id": "P-NEW-100", "category": "Cup Creams", "name": "Skin Light", "barcode": "6043000032811", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-101", "category": "Cup Creams", "name": "Every Beloved Care", "barcode": "6156000300980", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-102", "category": "Cup Creams", "name": "Vaseline Blue Seal", "barcode": "6151100139511", "quantity": 16, "price": "900"},
    {"id": "P-NEW-103", "category": "Cup Creams", "name": "Zyn Butter Skin & Hair", "barcode": "010101415338", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-104", "category": "Cup Creams", "name": "Carrot Shea Butter", "barcode": "6156000306612", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-105", "category": "Cup Creams", "name": "Jimbo Ori Shine Shine Body 260g", "barcode": "0608887104493", "quantity": 1, "price": "3200"},
    {"id": "P-NEW-106", "category": "Cup Creams", "name": "Jimbo Ori Shea Butter 180g", "barcode": "0608887023008", "quantity": 5, "price": "3000"},
    {"id": "P-NEW-107", "category": "Cup Creams", "name": "Jimbo Ori Small Shea Butter", "barcode": "0608887023039", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-108", "category": "Cup Creams", "name": "Ori Bright Big", "barcode": "", "quantity": 9, "price": "1000"},
    {"id": "P-NEW-109", "category": "Cup Creams", "name": "Ori Bright Small", "barcode": "", "quantity": 1, "price": "500"},
    {"id": "P-NEW-110", "category": "Cup Creams", "name": "Ewatomi Perfect Ori", "barcode": "", "quantity": 6, "price": "700"},
    {"id": "P-NEW-111", "category": "Cup Creams", "name": "Goya Oil", "barcode": "", "quantity": 9, "price": "900"},
    {"id": "P-NEW-112", "category": "Cup Creams", "name": "Stay Young", "barcode": "", "quantity": 4, "price": "4000"},
    {"id": "P-NEW-113", "category": "Cup Creams", "name": "Stay Young Face And Body Cream", "barcode": "", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-114", "category": "Cup Creams", "name": "Stay Young Face & Body Cream Small", "barcode": "", "quantity": 32, "price": "1000"},
    {"id": "P-NEW-115", "category": "Cup Creams", "name": "Kagic-Sane", "barcode": "4353213453450", "quantity": 1, "price": "0"},
    {"id": "P-NEW-116", "category": "Cup Creams", "name": "Zero Teche", "barcode": "6156000170787", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-117", "category": "Cup Creams", "name": "Idole", "barcode": "", "quantity": 5, "price": "1500"},
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
        seen_barcodes.add(barcode)

        product = None
        if barcode:
            product = Product.objects.filter(serial_code=barcode).first()
        if product is None:
            product = Product.objects.filter(id=item["id"]).first()

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
        ("api", "0007_user_username"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
