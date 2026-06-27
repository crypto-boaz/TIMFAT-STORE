from decimal import Decimal
import re

from django.db import migrations
from django.db.models import Q
from django.db.models.deletion import ProtectedError


PRODUCTS = [
    {"id": "P-NEW-725", "category": "Nail Polish", "name": "Nail Polish", "barcode": "", "quantity": 8, "price": "0"},
    {"id": "P-NEW-726", "category": "Lip Gloss", "name": "Lip Gloss", "barcode": "", "quantity": 16, "price": "0"},
    {"id": "P-NEW-727", "category": "Lip Gloss", "name": "Lip Gloss Absolute", "barcode": "", "quantity": 19, "price": "300"},
    {"id": "P-NEW-728", "category": "Lip Gloss", "name": "Squeeze And Shine", "barcode": "", "quantity": 74, "price": "300"},
    {"id": "P-NEW-729", "category": "Lip Gloss", "name": "Chapet Lip Gloss", "barcode": "", "quantity": 72, "price": "500"},
    {"id": "P-NEW-730", "category": "Lip Gloss", "name": "Beauty Model Magic Lip Gloss", "barcode": "", "quantity": 21, "price": "700"},
    {"id": "P-NEW-731", "category": "Lip Gloss", "name": "Magic Lip Gloss", "barcode": "", "quantity": 19, "price": "800"},
    {"id": "P-NEW-732", "category": "Lip Gloss", "name": "Fashion Cute Lip Gloss", "barcode": "", "quantity": 23, "price": "700"},
    {"id": "P-NEW-733", "category": "Lip Gloss", "name": "Matte Lipstick", "barcode": "", "quantity": 23, "price": "500"},
    {"id": "P-NEW-734", "category": "Lip Gloss", "name": "Matte Favour Beauty", "barcode": "", "quantity": 17, "price": "700"},
    {"id": "P-NEW-735", "category": "Lip Gloss", "name": "Charm Color Lip Gloss", "barcode": "", "quantity": 18, "price": "700"},
    {"id": "P-NEW-736", "category": "Lip Gloss", "name": "Lip Tint", "barcode": "", "quantity": 23, "price": "700"},
    {"id": "P-NEW-737", "category": "Lip Gloss", "name": "Mac Maren", "barcode": "", "quantity": 1, "price": "700"},
    {"id": "P-NEW-738", "category": "Lip Gloss", "name": "Mary Kay", "barcode": "", "quantity": 52, "price": "500"},
    {"id": "P-NEW-739", "category": "Lip Gloss", "name": "Favour Beauty Liquid Matte", "barcode": "", "quantity": 6, "price": "500"},
    {"id": "P-NEW-740", "category": "Lip Gloss", "name": "Favour Beauty Matte Lip Gloss", "barcode": "", "quantity": 18, "price": "700"},
    {"id": "P-NEW-741", "category": "Lip Gloss", "name": "Greentea Lipstick", "barcode": "", "quantity": 11, "price": "700"},
    {"id": "P-NEW-742", "category": "Lip Gloss", "name": "Lip Gloss Beauty Model", "barcode": "", "quantity": 2, "price": "400"},
    {"id": "P-NEW-743", "category": "Lip Gloss", "name": "Lip Plump", "barcode": "", "quantity": 6, "price": "700"},
    {"id": "P-NEW-744", "category": "Lip Gloss", "name": "Chamlanya Lip Colour", "barcode": "", "quantity": 4, "price": "1200"},
    {"id": "P-NEW-745", "category": "Lip Gloss", "name": "KissME Lip Gloss", "barcode": "", "quantity": 23, "price": "700"},
    {"id": "P-NEW-746", "category": "Lip Gloss", "name": "Fruit Lip Oil", "barcode": "", "quantity": 3, "price": "1200"},
    {"id": "P-NEW-747", "category": "Lip Gloss", "name": "Magic Your Life", "barcode": "", "quantity": 4, "price": "1200"},
    {"id": "P-NEW-748", "category": "Makeup", "name": "Luminious Foundation", "barcode": "", "quantity": 11, "price": "1200"},
    {"id": "P-NEW-749", "category": "Makeup", "name": "Fashion Fully Big", "barcode": "", "quantity": 6, "price": "2500"},
    {"id": "P-NEW-750", "category": "Makeup", "name": "Fashion Fully Small", "barcode": "", "quantity": 5, "price": "2000"},
    {"id": "P-NEW-751", "category": "Makeup", "name": "Aloe-vera", "barcode": "", "quantity": 7, "price": "3000"},
    {"id": "P-NEW-752", "category": "Makeup", "name": "Supa Stay", "barcode": "", "quantity": 2, "price": "3000"},
    {"id": "P-NEW-753", "category": "Makeup", "name": "Compact MakeUP", "barcode": "", "quantity": 4, "price": "2200"},
    {"id": "P-NEW-754", "category": "Makeup", "name": "Collagin", "barcode": "", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-755", "category": "Makeup", "name": "Virgin Italy Mascara", "barcode": "", "quantity": 8, "price": "500"},
    {"id": "P-NEW-756", "category": "Makeup", "name": "Absolute Eyeliner", "barcode": "", "quantity": 12, "price": "500"},
    {"id": "P-NEW-757", "category": "Makeup", "name": "Step2 Extra-volume Mascara (2 in 1)", "barcode": "", "quantity": 12, "price": "1000"},
    {"id": "P-NEW-758", "category": "Makeup", "name": "Micolor Greentea Compact Powder", "barcode": "", "quantity": 4, "price": "1300"},
    {"id": "P-NEW-759", "category": "Makeup", "name": "Cocoa-Butter Sun Shimmer", "barcode": "", "quantity": 4, "price": "800"},
    {"id": "P-NEW-760", "category": "Makeup", "name": "Classic Makeup", "barcode": "", "quantity": 3, "price": "3000"},
    {"id": "P-NEW-761", "category": "Makeup", "name": "Nniliania Minerals Compact Powder", "barcode": "", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-762", "category": "Makeup", "name": "GreenTea Kiala Beauty", "barcode": "", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-763", "category": "Makeup", "name": "Youthful Wear Spotless Powder", "barcode": "", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-764", "category": "Makeup", "name": "Wig Cap", "barcode": "", "quantity": 44, "price": "300"},
    {"id": "P-NEW-765", "category": "Makeup", "name": "Sasha Matte Color Palette", "barcode": "", "quantity": 2, "price": "4500"},
    {"id": "P-NEW-766", "category": "Makeup", "name": "Chamlook Contour & Blush", "barcode": "", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-767", "category": "Makeup", "name": "La-Queen Cosmetics", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-768", "category": "Makeup", "name": "Romanric Flower Fit Me (8 in 1)", "barcode": "", "quantity": 2, "price": "4500"},
    {"id": "P-NEW-769", "category": "Makeup", "name": "BMN Beauty", "barcode": "", "quantity": 12, "price": "500"},
    {"id": "P-NEW-770", "category": "Makeup", "name": "Imam-girl Foundation", "barcode": "", "quantity": 2, "price": "0"},
    {"id": "P-NEW-771", "category": "Makeup", "name": "Micolor Concealor Makeup", "barcode": "", "quantity": 14, "price": "3000"},
    {"id": "P-NEW-772", "category": "Makeup", "name": "HD-Fitme Matte Poreless", "barcode": "", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-773", "category": "Makeup", "name": "Super Matte HD-Flawless", "barcode": "", "quantity": 2, "price": "3000"},
    {"id": "P-NEW-774", "category": "Makeup", "name": "Mary-Kay Full Coverage Foundation", "barcode": "", "quantity": 5, "price": "2000"},
    {"id": "P-NEW-775", "category": "Makeup", "name": "Matifying Liquid Foundation", "barcode": "", "quantity": 3, "price": "0"},
    {"id": "P-NEW-776", "category": "Makeup", "name": "Mirror", "barcode": "", "quantity": 14, "price": "500"},
    {"id": "P-NEW-777", "category": "Makeup", "name": "I-Beauty (NAILS)", "barcode": "", "quantity": 41, "price": "200"},
    {"id": "P-NEW-778", "category": "Makeup", "name": "Polilike", "barcode": "", "quantity": 7, "price": "0"},
    {"id": "P-NEW-779", "category": "Makeup", "name": "Cottonbud", "barcode": "", "quantity": 2, "price": "100"},
    {"id": "P-NEW-780", "category": "Makeup", "name": "Shoe Water Polish Black", "barcode": "", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-781", "category": "Makeup", "name": "Shoe Water Polish Brown", "barcode": "", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-782", "category": "Makeup", "name": "Shoe Polish Black", "barcode": "", "quantity": 11, "price": "1000"},
    {"id": "P-NEW-783", "category": "Makeup", "name": "Ultimate Beauty Eyeliner", "barcode": "", "quantity": 24, "price": "300"},
    {"id": "P-NEW-784", "category": "Makeup", "name": "Hair Bonding Glue", "barcode": "", "quantity": 9, "price": "1000"},
    {"id": "P-NEW-785", "category": "Makeup", "name": "Frank-Bee Makeup Brush", "barcode": "", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-786", "category": "Makeup", "name": "King Nail-Filer", "barcode": "", "quantity": 34, "price": "300"},
    {"id": "P-NEW-787", "category": "Makeup", "name": "TEND-Extra Strenght Dissolver", "barcode": "", "quantity": 8, "price": "500"},
    {"id": "P-NEW-788", "category": "Makeup", "name": "LA-girl Face Finity Primer", "barcode": "", "quantity": 10, "price": "900"},
    {"id": "P-NEW-789", "category": "Makeup", "name": "Kaliya Beauty Face Powder", "barcode": "", "quantity": 31, "price": "0"},
    {"id": "P-NEW-790", "category": "Makeup", "name": "Red Cherry Eyelashes", "barcode": "", "quantity": 17, "price": "300"},
    {"id": "P-NEW-791", "category": "Makeup", "name": "Sara & Oliver Eyelashes", "barcode": "", "quantity": 62, "price": "300"},
    {"id": "P-NEW-792", "category": "Makeup", "name": "Dorco Twin Blame Shaver", "barcode": "", "quantity": 35, "price": "0"},
    {"id": "P-NEW-793", "category": "Makeup", "name": "Eyebrow Shave", "barcode": "", "quantity": 15, "price": "0"},
    {"id": "P-NEW-794", "category": "Nails", "name": "Everlasting French Nails (fingers)", "barcode": "", "quantity": 5, "price": "0"},
    {"id": "P-NEW-795", "category": "Nails", "name": "Everlasting French Nails (toes)", "barcode": "", "quantity": 2, "price": "0"},
    {"id": "P-NEW-796", "category": "Nails", "name": "G-Nails", "barcode": "", "quantity": 2, "price": "400"},
    {"id": "P-NEW-797", "category": "Beauty Accessories", "name": "YINLI Haircare", "barcode": "", "quantity": 30, "price": "0"},
    {"id": "P-NEW-798", "category": "Beauty Accessories", "name": "U-part Dome Cap", "barcode": "", "quantity": 3, "price": "0"},
    {"id": "P-NEW-799", "category": "Beauty Accessories", "name": "Baby Sponge", "barcode": "", "quantity": 2, "price": "700"},
    {"id": "P-NEW-800", "category": "Beauty Accessories", "name": "Hand Sponge", "barcode": "", "quantity": 8, "price": "500"},
    {"id": "P-NEW-801", "category": "Beauty Accessories", "name": "Cosmetic Pads", "barcode": "", "quantity": 3, "price": "2500"},
    {"id": "P-NEW-802", "category": "Beauty Accessories", "name": "Picking Comb", "barcode": "", "quantity": 58, "price": "200"},
    {"id": "P-NEW-803", "category": "Beauty Accessories", "name": "Picking Comb (iron)", "barcode": "", "quantity": 6, "price": "300"},
    {"id": "P-NEW-804", "category": "Beauty Accessories", "name": "Knitting Pin", "barcode": "", "quantity": 3, "price": "800"},
    {"id": "P-NEW-805", "category": "Beauty Accessories", "name": "Hair Parther (ilarun) Plastic", "barcode": "", "quantity": 22, "price": "150"},
    {"id": "P-NEW-806", "category": "Beauty Accessories", "name": "Hair Parther (ilarun) Iron", "barcode": "", "quantity": 2, "price": "200"},
    {"id": "P-NEW-807", "category": "Beauty Accessories", "name": "Hair Parther (ilarun) Wooden", "barcode": "", "quantity": 5, "price": "100"},
    {"id": "P-NEW-808", "category": "Beauty Accessories", "name": "Scissors", "barcode": "", "quantity": 5, "price": "0"},
    {"id": "P-NEW-809", "category": "Beauty Accessories", "name": "Big Picking Comb", "barcode": "", "quantity": 12, "price": "400"},
    {"id": "P-NEW-810", "category": "Brush", "name": "Hair Brush", "barcode": "", "quantity": 10, "price": "500"},
    {"id": "P-NEW-811", "category": "Beauty Accessories", "name": "Wooden Rug Brush", "barcode": "", "quantity": 3, "price": "0"},
    {"id": "P-NEW-812", "category": "Beauty Accessories", "name": "Afro Comb Coloured", "barcode": "", "quantity": 11, "price": "500"},
    {"id": "P-NEW-813", "category": "Beauty Accessories", "name": "Afro Comb Big", "barcode": "", "quantity": 26, "price": "300"},
    {"id": "P-NEW-814", "category": "Brush", "name": "Weavon Brush Big", "barcode": "", "quantity": 5, "price": "1800"},
    {"id": "P-NEW-815", "category": "Brush", "name": "Weavon Brush Small", "barcode": "", "quantity": 2, "price": "900"},
    {"id": "P-NEW-816", "category": "Brush", "name": "Mirror Brush Plastic Big", "barcode": "", "quantity": 5, "price": "1800"},
    {"id": "P-NEW-817", "category": "Brush", "name": "Mirror Brush Plastic Small", "barcode": "", "quantity": 4, "price": "1300"},
    {"id": "P-NEW-818", "category": "Beauty Accessories", "name": "Crochet Pin", "barcode": "", "quantity": 39, "price": "1300"},
    {"id": "P-NEW-819", "category": "Beauty Accessories", "name": "Crochet Hook", "barcode": "", "quantity": 9, "price": "300"},
    {"id": "P-NEW-820", "category": "Beauty Accessories", "name": "Afro Comb Small", "barcode": "", "quantity": 4, "price": "800"},
    {"id": "P-NEW-821", "category": "Beauty Accessories", "name": "Afro Comb Medium", "barcode": "", "quantity": 13, "price": "150"},
    {"id": "P-NEW-822", "category": "Hair (Attachment)", "name": "Super Braids Xpression", "barcode": "", "quantity": 10, "price": "0"},
    {"id": "P-NEW-823", "category": "Hair (Attachment)", "name": "Lagos Mega Braids (6x)", "barcode": "", "quantity": 9, "price": "6000"},
    {"id": "P-NEW-824", "category": "Hair (Attachment)", "name": "Xpression Agege Braids", "barcode": "", "quantity": 5, "price": "6000"},
    {"id": "P-NEW-825", "category": "Hair (Attachment)", "name": "Lagos Braids", "barcode": "", "quantity": 20, "price": "2500"},
    {"id": "P-NEW-826", "category": "Hair (Attachment)", "name": "Ultra Braids", "barcode": "", "quantity": 3, "price": "2500"},
    {"id": "P-NEW-827", "category": "Hair (Attachment)", "name": "Rich Braids", "barcode": "", "quantity": 17, "price": "4000"},
    {"id": "P-NEW-828", "category": "Hair (Attachment)", "name": "3x Pre-stretched Braids", "barcode": "", "quantity": 7, "price": "4000"},
    {"id": "P-NEW-829", "category": "Hair (Attachment)", "name": "Lagos Mega Braids (7x)", "barcode": "", "quantity": 3, "price": "6000"},
    {"id": "P-NEW-830", "category": "Hair (Attachment)", "name": "Xpress 4x Happy", "barcode": "", "quantity": 3, "price": "5500"},
    {"id": "P-NEW-831", "category": "Hair (Attachment)", "name": "Xpression Ceres", "barcode": "", "quantity": 5, "price": "3500"},
    {"id": "P-NEW-832", "category": "Hair (Attachment)", "name": "Xpression Jamaica Locs", "barcode": "", "quantity": 2, "price": "8500"},
    {"id": "P-NEW-833", "category": "Hair (Attachment)", "name": "Azonto Curls", "barcode": "", "quantity": 6, "price": "5000"},
    {"id": "P-NEW-834", "category": "Hair (Attachment)", "name": "Azonto Curls twist", "barcode": "", "quantity": 6, "price": "4500"},
    {"id": "P-NEW-835", "category": "Hair (Attachment)", "name": "Azonto Pro Locs", "barcode": "", "quantity": 5, "price": "6500"},
    {"id": "P-NEW-836", "category": "Hair (Attachment)", "name": "Azonto Galaxy", "barcode": "", "quantity": 2, "price": "6500"},
    {"id": "P-NEW-837", "category": "Hair (Attachment)", "name": "Azonto Marley Balls", "barcode": "", "quantity": 1, "price": "7000"},
    {"id": "P-NEW-838", "category": "Hair (Attachment)", "name": "Azonto Bliss Lock", "barcode": "", "quantity": 1, "price": "6500"},
    {"id": "P-NEW-839", "category": "Hair (Attachment)", "name": "Noble Gold Natural Braids", "barcode": "", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-840", "category": "Hair (Attachment)", "name": "Noble Gold Afro Braids", "barcode": "", "quantity": 2, "price": "2500"},
    {"id": "P-NEW-841", "category": "Hair (Attachment)", "name": "Nectar Afro Fumky", "barcode": "", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-842", "category": "Human Hair", "name": "De-javu Diva (8 inches)", "barcode": "", "quantity": 2, "price": "11000"},
    {"id": "P-NEW-843", "category": "Human Hair", "name": "Nicki with Closure (12 inches)", "barcode": "", "quantity": 1, "price": "20000"},
    {"id": "P-NEW-844", "category": "Human Hair", "name": "Queen&Girl with Closure (12 inches)", "barcode": "", "quantity": 1, "price": "13000"},
    {"id": "P-NEW-845", "category": "Human Hair", "name": "Monica Human Hair (16 inches)", "barcode": "", "quantity": 1, "price": "14000"},
    {"id": "P-NEW-846", "category": "Human Hair", "name": "Fumi Hair Miss luxe", "barcode": "", "quantity": 1, "price": "11000"},
    {"id": "P-NEW-847", "category": "Human Hair", "name": "Noble Gold Mirabel", "barcode": "", "quantity": 1, "price": "4500"},
    {"id": "P-NEW-848", "category": "Human Hair", "name": "Selina STW (20 inches)", "barcode": "", "quantity": 4, "price": "5000"},
    {"id": "P-NEW-849", "category": "Human Hair", "name": "Platinum ST BOBO (20 inches)", "barcode": "", "quantity": 1, "price": "11000"},
    {"id": "P-NEW-850", "category": "Human Hair", "name": "Monical Jerry Curl (20+ inches)", "barcode": "", "quantity": 1, "price": "18000"},
    {"id": "P-NEW-851", "category": "Human Hair", "name": "Mongolan Jerry Curl (16 inches)", "barcode": "", "quantity": 2, "price": "18000"},
    {"id": "P-NEW-852", "category": "Human Hair", "name": "Flower STW (12 inches)", "barcode": "", "quantity": 2, "price": "11000"},
    {"id": "P-NEW-853", "category": "Human Hair", "name": "JAS STW", "barcode": "", "quantity": 2, "price": "15000"},
    {"id": "P-NEW-854", "category": "Human Hair", "name": "Fuli-Miya with Closure", "barcode": "", "quantity": 2, "price": "14000"},
    {"id": "P-NEW-855", "category": "Human Hair", "name": "Joy Reap Dancing Curl (18 inches)", "barcode": "", "quantity": 1, "price": "19000"},
    {"id": "P-NEW-856", "category": "Human Hair", "name": "Nicki Pretty Curls (12 inches)", "barcode": "", "quantity": 3, "price": "13000"},
    {"id": "P-NEW-857", "category": "Human Hair", "name": "Isabella (28 inches)", "barcode": "", "quantity": 1, "price": "23000"},
    {"id": "P-NEW-858", "category": "Human Hair", "name": "Thormona STW", "barcode": "", "quantity": 1, "price": "14000"},
    {"id": "P-NEW-859", "category": "Human Hair", "name": "Angel STW (18 inches)", "barcode": "", "quantity": 2, "price": "14000"},
    {"id": "P-NEW-860", "category": "Human Hair", "name": "Felicia Body Wave (24 inches)", "barcode": "", "quantity": 2, "price": "10000"},
    {"id": "P-NEW-861", "category": "Human Hair", "name": "Malaysia STW", "barcode": "", "quantity": 2, "price": "15000"},
    {"id": "P-NEW-862", "category": "Human Hair", "name": "Hair Sense", "barcode": "", "quantity": 3, "price": "6500"},
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
        ("api", "0017_import_pelumi_wipes_diapers_soap"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
