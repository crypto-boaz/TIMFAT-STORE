from decimal import Decimal
import re

from django.db import migrations
from django.db.models import Q
from django.db.models.deletion import ProtectedError


PRODUCTS = [
    {"id": "P-NEW-538", "category": "Accessories", "name": "AI Tracking", "barcode": "", "quantity": 2, "price": "35000"},
    {"id": "P-NEW-539", "category": "Accessories", "name": "J C 18 Tripod Stand", "barcode": "", "quantity": 1, "price": "10000"},
    {"id": "P-NEW-540", "category": "Accessories", "name": "L 16 Tripod Stand", "barcode": "", "quantity": 3, "price": "16000"},
    {"id": "P-NEW-541", "category": "Accessories", "name": "LED Light 600", "barcode": "", "quantity": 0, "price": "30000"},
    {"id": "P-NEW-542", "category": "Accessories", "name": "Microphone Holder", "barcode": "", "quantity": 3, "price": "5000"},
    {"id": "P-NEW-543", "category": "Accessories", "name": "Microphone K9", "barcode": "", "quantity": 1, "price": "15000"},
    {"id": "P-NEW-544", "category": "Accessories", "name": "Microphone Single", "barcode": "", "quantity": 1, "price": "10000"},
    {"id": "P-NEW-545", "category": "Accessories", "name": "Mobile Phone LED Light", "barcode": "", "quantity": 3, "price": "10000"},
    {"id": "P-NEW-546", "category": "Accessories", "name": "Selfie Stick Black", "barcode": "", "quantity": 10, "price": "5000"},
    {"id": "P-NEW-547", "category": "Accessories", "name": "Selfie Stick Pink", "barcode": "", "quantity": 10, "price": "5000"},
    {"id": "P-NEW-548", "category": "Accessories", "name": "WT 3520 Tripod Stand", "barcode": "", "quantity": 5, "price": "25000"},
    {"id": "P-NEW-549", "category": "Accessories", "name": "Z6D Tripod Stand", "barcode": "", "quantity": 5, "price": "15000"},
    {"id": "P-NEW-550", "category": "Air Freshener", "name": "Air Freshener Strawberry", "barcode": "6959259201970", "quantity": 1, "price": "4000"},
    {"id": "P-NEW-551", "category": "Air Freshener", "name": "Todakekay Air Freshener Strawberry", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-552", "category": "CLEANSING", "name": "Clear Kpata-Kpata", "barcode": "731946512417", "quantity": 4, "price": "1200"},
    {"id": "P-NEW-553", "category": "Face cream", "name": "CLEAR KPATA-KPATA", "barcode": "731946512271", "quantity": 6, "price": "1000"},
    {"id": "P-NEW-554", "category": "hair Cream", "name": "2 Black 110G", "barcode": "6154000403027", "quantity": 12, "price": "1200"},
    {"id": "P-NEW-555", "category": "Face cream", "name": "5.5 Face Cream", "barcode": "6925267308413", "quantity": 3, "price": "5000"},
    {"id": "P-NEW-556", "category": "Body cream", "name": "African Queen Cup", "barcode": "6600427110142", "quantity": 6, "price": "1300"},
    {"id": "P-NEW-557", "category": "Soap", "name": "Ashantee 3 In 1", "barcode": "8858741900156", "quantity": 0, "price": "1900"},
    {"id": "P-NEW-558", "category": "sopa", "name": "Aashantee 4 In 1", "barcode": "8858741900200", "quantity": 0, "price": "2000"},
    {"id": "P-NEW-559", "category": "sopa", "name": "Ashantee Papaya", "barcode": "8855753000034", "quantity": 12, "price": "1600"},
    {"id": "P-NEW-560", "category": "Face cream", "name": "B T Plus B.S.C", "barcode": "3570753222228", "quantity": 6, "price": "1000"},
    {"id": "P-NEW-561", "category": "Creams", "name": "BODY LOTION HYDRATING Coconut oil", "barcode": "6154000071110", "quantity": 2, "price": "0"},
    {"id": "P-NEW-562", "category": "Creams", "name": "Beauty Skincare", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-563", "category": "soap", "name": "Carotone Soap", "barcode": "6182000100462", "quantity": 12, "price": "1500"},
    {"id": "P-NEW-564", "category": "soap", "name": "Carro White", "barcode": "6181100530094", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-565", "category": "Creams cream", "name": "Damatol 55g", "barcode": "6156000118239", "quantity": 12, "price": "1300"},
    {"id": "P-NEW-566", "category": "Creams cream", "name": "Damatol 110g Damatol 55g", "barcode": "6156000118239", "quantity": 12, "price": "2500"},
    {"id": "P-NEW-567", "category": "cleansing", "name": "Dermaliss Bleaching", "barcode": "68600023292", "quantity": 6, "price": "20000"},
    {"id": "P-NEW-568", "category": "Lotion", "name": "Developer", "barcode": "6976175390335", "quantity": 3, "price": "2800"},
    {"id": "P-NEW-569", "category": "serum", "name": "Disaar Carrot serum", "barcode": "1981682041750", "quantity": 12, "price": "1700"},
    {"id": "P-NEW-570", "category": "Face cream", "name": "Dr Rashell Face Cream", "barcode": "6971764150147", "quantity": 5, "price": "3500"},
    {"id": "P-NEW-571", "category": "Soap", "name": "Egg Yolk Soap", "barcode": "8852350640021", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-572", "category": "Creams", "name": "GOLD SKIN A LA BAVE D'ESCARGOT", "barcode": "6181100321500", "quantity": 6, "price": "2800"},
    {"id": "P-NEW-573", "category": "Face Cream", "name": "Gbogbonise bsc", "barcode": "0180204479625", "quantity": 12, "price": "1000"},
    {"id": "P-NEW-574", "category": "tube", "name": "IDEAL MEN HYDRATION", "barcode": "6181100382358", "quantity": 3, "price": "1400"},
    {"id": "P-NEW-575", "category": "SOAP", "name": "USA K Brothers Soap Mix", "barcode": "8853252002351", "quantity": 24, "price": "1500"},
    {"id": "P-NEW-576", "category": "LOTION", "name": "Light Up LOTION 400ML", "barcode": "6043000036963", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-577", "category": "Lotion", "name": "NIVEA body lotion Sensual Musk", "barcode": "400808704514", "quantity": 3, "price": "7500"},
    {"id": "P-NEW-578", "category": "Lotion", "name": "Neoskin Big LOTION", "barcode": "714084850931", "quantity": 5, "price": "3500"},
    {"id": "P-NEW-579", "category": "lotion", "name": "Neoskin Medium lotion", "barcode": "714084850924", "quantity": 7, "price": "2200"},
    {"id": "P-NEW-580", "category": "Creams", "name": "Nivea Roll On", "barcode": "", "quantity": 20, "price": "2000"},
    {"id": "P-NEW-581", "category": "Lotion", "name": "Olivera lotion", "barcode": "6182000107157", "quantity": 4, "price": "4000"},
    {"id": "P-NEW-582", "category": "bsc", "name": "Olivera B.S.C", "barcode": "6182000115626", "quantity": 12, "price": "1300"},
    {"id": "P-NEW-583", "category": "Soap", "name": "Olivera Soap", "barcode": "6182000104835", "quantity": 6, "price": "1900"},
    {"id": "P-NEW-584", "category": "ori", "name": "Ori Ghana Big", "barcode": "", "quantity": 6, "price": "1000"},
    {"id": "P-NEW-585", "category": "ori", "name": "Ori Ghana Small", "barcode": "", "quantity": 6, "price": "500"},
    {"id": "P-NEW-586", "category": "powder", "name": "Passion Powder Medium 200g", "barcode": "5285002321833", "quantity": 1, "price": "800"},
    {"id": "P-NEW-587", "category": "powder", "name": "Passion Powder Small 90g", "barcode": "5285002321840", "quantity": 1, "price": "500"},
    {"id": "P-NEW-588", "category": "lotion", "name": "Pears , Mild & Gentle", "barcode": "6151100139429", "quantity": 1, "price": "2300"},
    {"id": "P-NEW-589", "category": "Oil", "name": "Pears oil", "barcode": "6151100139405", "quantity": 1, "price": "2300"},
    {"id": "P-NEW-590", "category": "soap", "name": "Perfect Glow", "barcode": "6028050107214", "quantity": 4, "price": "1600"},
    {"id": "P-NEW-591", "category": "Hair cream", "name": "So Fine", "barcode": "754083557844", "quantity": 12, "price": "2300"},
    {"id": "P-NEW-592", "category": "pad", "name": "Soft Care Roll sanitary pad", "barcode": "6156000349251", "quantity": 4, "price": "300"},
    {"id": "P-NEW-593", "category": "lotion", "name": "Soft flower EXTRA MOISTURIZING & LIGHTENING", "barcode": "9715593082340", "quantity": 6, "price": "3500"},
    {"id": "P-NEW-594", "category": "tube", "name": "Tvdinear tube", "barcode": "6928623097006", "quantity": 5, "price": "1000"},
    {"id": "P-NEW-595", "category": "lotion", "name": "Vaseline Intensive Care cocoa radiant 725ml", "barcode": "305210142558", "quantity": 3, "price": "7500"},
    {"id": "P-NEW-596", "category": "oil", "name": "Visita Oil", "barcode": "714084875606", "quantity": 6, "price": "1200"},
    {"id": "P-NEW-597", "category": "lotion", "name": "Vitamin C PERKING LOTION HYALURONIC ACID", "barcode": "3574660049763", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-598", "category": "lotion", "name": "White Secret Big", "barcode": "6028050098819", "quantity": 5, "price": "4000"},
    {"id": "P-NEW-599", "category": "lotion", "name": "White Secret Medium", "barcode": "6028050090288", "quantity": 4, "price": "2800"},
    {"id": "P-NEW-600", "category": "Soap", "name": "White Secret Soap", "barcode": "6028050090233", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-601", "category": "bsc", "name": "White White bsc", "barcode": "6154000364748", "quantity": 12, "price": "1300"},
    {"id": "P-NEW-602", "category": "Cup Creams", "name": "Cocoderm", "barcode": "6181100324150", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-603", "category": "Soap", "name": "Caro White", "barcode": "6181100530094", "quantity": 12, "price": "1500"},
    {"id": "P-NEW-604", "category": "Soap", "name": "Nano Soap", "barcode": "8857110780818", "quantity": 12, "price": "2000"},
    {"id": "P-NEW-605", "category": "Soap", "name": "meriko Soap", "barcode": "5028929004027", "quantity": 12, "price": "750"},
    {"id": "P-NEW-606", "category": "Soap", "name": "Premier Cool Soap", "barcode": "6151100310002", "quantity": 36, "price": "450"},
    {"id": "P-NEW-607", "category": "Soap", "name": "Veet Soap African black", "barcode": "8859362504129", "quantity": 24, "price": "3500"},
    {"id": "P-NEW-608", "category": "Soap", "name": "Classy soft and gentle", "barcode": "5065014005705", "quantity": 12, "price": "700"},
    {"id": "P-NEW-609", "category": "Soap", "name": "Classy soft and gentle", "barcode": "5065014005231", "quantity": 12, "price": "700"},
    {"id": "P-NEW-610", "category": "Soap", "name": "Eva Soap", "barcode": "6154000269210", "quantity": 1, "price": "700"},
    {"id": "P-NEW-611", "category": "Soap", "name": "Eva Soap", "barcode": "6154000269272", "quantity": 1, "price": "700"},
    {"id": "P-NEW-612", "category": "Soap", "name": "Eva Soap", "barcode": "6154000269258", "quantity": 12, "price": "700"},
    {"id": "P-NEW-613", "category": "Detergent", "name": "Rafa 125g", "barcode": "630902434155", "quantity": 1, "price": "450"},
    {"id": "P-NEW-614", "category": "Detergent", "name": "Rafa 850g", "barcode": "630902434360", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-615", "category": "Soap", "name": "Siri", "barcode": "745110908241", "quantity": 1, "price": "700"},
    {"id": "P-NEW-616", "category": "Toiletries", "name": "Soft Care Pad by 10", "barcode": "6156000349237", "quantity": 10, "price": "800"},
    {"id": "P-NEW-617", "category": "Toiletries", "name": "Soft Care Pad by 30", "barcode": "6156000349206", "quantity": 24, "price": "3000"},
    {"id": "P-NEW-618", "category": "Detergent", "name": "Viva plus 80g", "barcode": "705632130209", "quantity": 12, "price": "250"},
    {"id": "P-NEW-619", "category": "Detergent", "name": "Viva plus 170g", "barcode": "705632130018", "quantity": 12, "price": "450"},
    {"id": "P-NEW-620", "category": "Detergent", "name": "Viva plus 850g", "barcode": "705632130193", "quantity": 1, "price": "2200"},
    {"id": "P-NEW-621", "category": "Face Creams", "name": "Jaune aCeuf TOANS TOURS EXTRA STRONG TREATING & CLARIFYING ERASER CREAM EGG YOLK", "barcode": "6186000563616", "quantity": 1, "price": "2800"},
    {"id": "P-NEW-622", "category": "Face Creams", "name": "pure White Carrot facial brightening cream", "barcode": "6394594190044", "quantity": 3, "price": "4500"},
    {"id": "P-NEW-623", "category": "Flirt", "name": "Sniper Flirts", "barcode": "6154000113155", "quantity": 6, "price": "2500"},
    {"id": "P-NEW-624", "category": "Hair Cream / Treatment", "name": "Alovera Gel", "barcode": "6947835824446", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-625", "category": "Hair Cream / Treatment", "name": "Glow Booster Oil", "barcode": "094683002550", "quantity": 2, "price": "6000"},
    {"id": "P-NEW-626", "category": "Hair Cream / Treatment", "name": "Butter Fly Hair Spray", "barcode": "6942691220203", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-627", "category": "Hair Cream / Treatment", "name": "Cruset Dye", "barcode": "8850407001115", "quantity": 12, "price": "1500"},
    {"id": "P-NEW-628", "category": "Lotion", "name": "D E S", "barcode": "6182000105023", "quantity": 3, "price": "3300"},
    {"id": "P-NEW-629", "category": "Hair Cream / Treatment", "name": "Disaar Beards Growth", "barcode": "6932511216509", "quantity": 6, "price": "2500"},
    {"id": "P-NEW-630", "category": "Hair Cream / Treatment", "name": "Hair Harmony Hair Oil", "barcode": "5001311229420", "quantity": 12, "price": "1800"},
    {"id": "P-NEW-631", "category": "Hair Cream / Treatment", "name": "Hair Wax", "barcode": "", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-632", "category": "Hair Cream / Treatment", "name": "Kaima Wax", "barcode": "", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-633", "category": "Hair Cream / Treatment", "name": "Kareem Paris Hair Wax", "barcode": "", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-634", "category": "Hair Cream / Treatment", "name": "Lola Spray", "barcode": "5689977987771", "quantity": 12, "price": "1000"},
    {"id": "P-NEW-635", "category": "Hair Cream / Treatment", "name": "Mega Growth Satch", "barcode": "6154000086060", "quantity": 12, "price": "300"},
    {"id": "P-NEW-636", "category": "Hair Cream / Treatment", "name": "Mega Growth Leaving cup", "barcode": "6154000086947", "quantity": 12, "price": "2000"},
    {"id": "P-NEW-637", "category": "Hair Cream / Treatment", "name": "Natural Field Hair Oil", "barcode": "608887027211", "quantity": 6, "price": "2300"},
    {"id": "P-NEW-638", "category": "Hair Cream / Treatment", "name": "Natural Field Hair Spray", "barcode": "608887027198", "quantity": 6, "price": "2300"},
    {"id": "P-NEW-639", "category": "Hair Cream / Treatment", "name": "Olive Oil Powder", "barcode": "", "quantity": 2, "price": "5000"},
    {"id": "P-NEW-640", "category": "Hair Cream / Treatment", "name": "Orion Hair Dye", "barcode": "6954545122670", "quantity": 15, "price": "1500"},
    {"id": "P-NEW-641", "category": "Hair Cream / Treatment", "name": "Papaya Hair Wax Ordinary", "barcode": "9780201379624", "quantity": 12, "price": "1200"},
    {"id": "P-NEW-642", "category": "Hair Cream / Treatment", "name": "Supreme Powder Dye", "barcode": "", "quantity": 6, "price": "5000"},
    {"id": "P-NEW-643", "category": "Hair Cream / Treatment", "name": "T C B herbal hair food", "barcode": "6154000086206", "quantity": 6, "price": "1500"},
    {"id": "P-NEW-644", "category": "Hair Cream / Treatment", "name": "T C B hair food", "barcode": "6154000086114", "quantity": 6, "price": "1500"},
    {"id": "P-NEW-645", "category": "Hair Treatment", "name": "Merit", "barcode": "608887029406", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-646", "category": "Hair Treatment", "name": "Tovch Color", "barcode": "6970851162049", "quantity": 1, "price": "0"},
    {"id": "P-NEW-647", "category": "Hair Treatment", "name": "Vinuz Anti dandruff Shampoo small", "barcode": "711856530213", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-648", "category": "Lip Gloss", "name": "Absolute Lips Gloss", "barcode": "6977527420007", "quantity": 1, "price": "300"},
    {"id": "P-NEW-649", "category": "Lip Gloss", "name": "Lips balm noble", "barcode": "", "quantity": 12, "price": "1500"},
    {"id": "P-NEW-650", "category": "Lip Gloss", "name": "Pink Lips Balm", "barcode": "", "quantity": 12, "price": "1000"},
    {"id": "P-NEW-651", "category": "Lotions", "name": "Blooming Bouquet", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-652", "category": "Lotions", "name": "Carotone Lotion small", "barcode": "6182000109939", "quantity": 3, "price": "2800"},
    {"id": "P-NEW-653", "category": "Lotions", "name": "Carotone Lotion medium", "barcode": "6182000100455", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-654", "category": "Lotions", "name": "Carotone Lotion big", "barcode": "6182000105382", "quantity": 3, "price": "4000"},
    {"id": "P-NEW-655", "category": "Perfume / Spray", "name": "24k Spray", "barcode": "6154000071967", "quantity": 12, "price": "3500"},
    {"id": "P-NEW-656", "category": "Perfume / Spray", "name": "Cristal", "barcode": "6291108734780", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-657", "category": "Perfume / Spray", "name": "LOVE FRAGRANCE MIST BRUME PERFUME", "barcode": "7977700077607", "quantity": 1, "price": "2300"},
    {"id": "P-NEW-658", "category": "Roll On", "name": "Cosmo Anti-Perspirant Natural", "barcode": "6294015195590", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-659", "category": "Scrub", "name": "S&K Duchesse Carebeau", "barcode": "8851427002519", "quantity": 12, "price": "4500"},
    {"id": "P-NEW-660", "category": "Lotion", "name": "Xx white Xx white", "barcode": "852222237333", "quantity": 8, "price": "5000"},
    {"id": "P-NEW-661", "category": "Soaps", "name": "Dettol Cool 55g", "barcode": "6151100282118", "quantity": 20, "price": "500"},
    {"id": "P-NEW-662", "category": "Soaps", "name": "Dettol Cool 750g", "barcode": "6151100281395", "quantity": 11, "price": "700"},
    {"id": "P-NEW-663", "category": "Soaps", "name": "Dettol Original 55g", "barcode": "6151100282880", "quantity": 6, "price": "500"},
    {"id": "P-NEW-664", "category": "Soaps", "name": "Dettol Original 12hrs", "barcode": "6151100281562", "quantity": 5, "price": "1500"},
    {"id": "P-NEW-665", "category": "Soaps", "name": "Dettol Skin Care 110", "barcode": "6151100282255", "quantity": 12, "price": "1500"},
    {"id": "P-NEW-666", "category": "Soaps", "name": "Dettol Skin Care 55g", "barcode": "6151100282200", "quantity": 12, "price": "500"},
    {"id": "P-NEW-667", "category": "Tubes", "name": "Erythromycin Gel USP Erybrocin", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-668", "category": "Tubes", "name": "Fast Action Tube White Now", "barcode": "", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-669", "category": "Tubes Tubes", "name": "White Now Cream", "barcode": "", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-670", "category": "soap", "name": "koji san single", "barcode": "4809013300017", "quantity": 13, "price": "2500"},
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
        ("api", "0015_import_toiletries_stock"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
