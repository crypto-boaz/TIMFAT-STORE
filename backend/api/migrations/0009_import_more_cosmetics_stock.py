from decimal import Decimal

from django.db import migrations


PRODUCTS = [
    {"id": "P-NEW-118", "category": "Hair Treatment", "name": "Dallas Conditioning Creme Relaxer Medium", "barcode": "6156000207889", "quantity": 12, "price": "1600"},
    {"id": "P-NEW-119", "category": "Hair Treatment", "name": "Dallas Conditioning Creme Relaxer Small", "barcode": "6156000207896", "quantity": 1, "price": "1200"},
    {"id": "P-NEW-120", "category": "Hair Treatment", "name": "Relax Regular Creme Relaxer", "barcode": "6152110049456", "quantity": 1, "price": "1200"},
    {"id": "P-NEW-121", "category": "Hair Treatment", "name": "Multisheen Ebony", "barcode": "0714084851075", "quantity": 10, "price": "1500"},
    {"id": "P-NEW-122", "category": "Hair Treatment", "name": "Ozone", "barcode": "6156000101071", "quantity": 5, "price": "1600"},
    {"id": "P-NEW-123", "category": "Hair Treatment", "name": "Soft Wave", "barcode": "7342358480715", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-124", "category": "Hair Treatment", "name": "Beva Conditioning Creme Relaxer Medium", "barcode": "6156000008493", "quantity": 4, "price": "1600"},
    {"id": "P-NEW-125", "category": "Hair Treatment", "name": "Beva Creme Relaxer Medium", "barcode": "6156000008509", "quantity": 1, "price": "1200"},
    {"id": "P-NEW-126", "category": "Hair Treatment", "name": "Beva Relaxer", "barcode": "615000008486", "quantity": 1, "price": "2800"},
    {"id": "P-NEW-127", "category": "Tubes", "name": "Acneaway Cream", "barcode": "2780487807140", "quantity": 3, "price": "1000"},
    {"id": "P-NEW-128", "category": "Tubes", "name": "Epiderm Cream", "barcode": "0108902292003887", "quantity": 4, "price": "1000"},
    {"id": "P-NEW-129", "category": "Tubes", "name": "Mercy Ointment", "barcode": "2556485615652", "quantity": 11, "price": "1300"},
    {"id": "P-NEW-130", "category": "Tubes", "name": "Erythromycin Gel USP Erybrocin", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-131", "category": "Tubes", "name": "Aquasulf", "barcode": "", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-132", "category": "Tubes", "name": "Sulfur Ointment", "barcode": "8906009231426", "quantity": 9, "price": "1000"},
    {"id": "P-NEW-133", "category": "Tubes", "name": "ABF Cream", "barcode": "", "quantity": 1, "price": "700"},
    {"id": "P-NEW-134", "category": "Tubes", "name": "Vixaskineal", "barcode": "6921465734849", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-135", "category": "Tubes", "name": "White Now Tube", "barcode": "", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-136", "category": "Tubes", "name": "White Now Cream Fast Action Tube", "barcode": "", "quantity": 3, "price": "0"},
    {"id": "P-NEW-137", "category": "Tubes", "name": "Tydineal", "barcode": "6928623097006", "quantity": 5, "price": "1000"},
    {"id": "P-NEW-138", "category": "Tubes", "name": "Funbact-A Triple Action Cream", "barcode": "8906009234083", "quantity": 10, "price": "1800"},
    {"id": "P-NEW-139", "category": "Tubes", "name": "Funbact-A Cream", "barcode": "8906009234083", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-140", "category": "Tubes", "name": "Piment Doux", "barcode": "1023745841867", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-141", "category": "Tubes", "name": "Crusader", "barcode": "8904220601998", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-142", "category": "Tubes", "name": "New Light", "barcode": "6181100422979", "quantity": 1, "price": "2800"},
    {"id": "P-NEW-143", "category": "Tubes", "name": "G-Derm Cream", "barcode": "890609234151", "quantity": 3, "price": "1000"},
    {"id": "P-NEW-144", "category": "Tubes", "name": "Abutin Clears", "barcode": "", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-145", "category": "Tubes", "name": "Bafama Cream", "barcode": "8906009234366", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-146", "category": "Tubes", "name": "Lemonvate", "barcode": "", "quantity": 5, "price": "1000"},
    {"id": "P-NEW-147", "category": "Tubes", "name": "Esapharma Movate", "barcode": "", "quantity": 6, "price": "1000"},
    {"id": "P-NEW-148", "category": "Tubes", "name": "Visita Plus Creme", "barcode": "0714084870779", "quantity": 15, "price": "1000"},
    {"id": "P-NEW-149", "category": "Tubes", "name": "Neoskin Cream", "barcode": "", "quantity": 5, "price": "1000"},
    {"id": "P-NEW-150", "category": "Tubes", "name": "Caro White", "barcode": "6181100531008", "quantity": 8, "price": "1000"},
    {"id": "P-NEW-151", "category": "Tubes", "name": "Mocan Triple Action Creme", "barcode": "", "quantity": 3, "price": "1000"},
    {"id": "P-NEW-152", "category": "Tubes", "name": "Olaybact Cream", "barcode": "", "quantity": 8, "price": "800"},
    {"id": "P-NEW-153", "category": "Tubes", "name": "White Secret Cream", "barcode": "", "quantity": 4, "price": "1000"},
    {"id": "P-NEW-154", "category": "Tubes", "name": "Fevicid Cream", "barcode": "", "quantity": 6, "price": "1000"},
    {"id": "P-NEW-155", "category": "Tubes", "name": "Orbi 20", "barcode": "", "quantity": 6, "price": "1500"},
    {"id": "P-NEW-156", "category": "Tubes", "name": "Tribact", "barcode": "6154000136031", "quantity": 11, "price": "1000"},
    {"id": "P-NEW-157", "category": "Tubes", "name": "Ytacan", "barcode": "8904135507168", "quantity": 1, "price": "800"},
    {"id": "P-NEW-158", "category": "Tubes", "name": "Halar", "barcode": "6154000136185", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-159", "category": "Tubes", "name": "Diclosal Plus", "barcode": "", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-160", "category": "Tubes", "name": "Dr. Rashel", "barcode": "", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-161", "category": "Body Oil", "name": "Pears", "barcode": "6151100139405", "quantity": 4, "price": "2000"},
    {"id": "P-NEW-162", "category": "Body Oil", "name": "Disaar Beauty Skincare Rosemary Oil", "barcode": "6932511228809", "quantity": 1, "price": "1700"},
    {"id": "P-NEW-163", "category": "Body Oil", "name": "Disaar Beauty Skincare Avocado", "barcode": "6932511222036", "quantity": 3, "price": "1700"},
    {"id": "P-NEW-164", "category": "Body Oil", "name": "Disaar Beauty Skincare Papaya", "barcode": "6932511222036", "quantity": 1, "price": "1700"},
    {"id": "P-NEW-165", "category": "Body Oil", "name": "Disaar Carrot Miracle", "barcode": "6932511222050", "quantity": 4, "price": "1700"},
    {"id": "P-NEW-166", "category": "Body Oil", "name": "Disaar Beauty Skincare Castor Oil", "barcode": "6932511217964", "quantity": 4, "price": "1700"},
    {"id": "P-NEW-167", "category": "Body Oil", "name": "Disaar Beauty Skincare Jojoba Oil", "barcode": "6932511211933", "quantity": 1, "price": "1700"},
    {"id": "P-NEW-168", "category": "Body Oil", "name": "Disaar Beauty Skincare Almond Oil", "barcode": "6932511217957", "quantity": 4, "price": "1700"},
    {"id": "P-NEW-169", "category": "Body Oil", "name": "Disaar Beauty Skincare VC", "barcode": "6932511217971", "quantity": 1, "price": "1700"},
    {"id": "P-NEW-170", "category": "Body Oil", "name": "Ladyvic Pure Natural Carrot", "barcode": "", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-171", "category": "Body Oil", "name": "Piment Doux", "barcode": "6174000207432", "quantity": 2, "price": "3500"},
    {"id": "P-NEW-172", "category": "Body Oil", "name": "Abana BSC", "barcode": "6182000126233", "quantity": 3, "price": "1400"},
    {"id": "P-NEW-173", "category": "Body Oil", "name": "B.B. Clear BSC", "barcode": "6028050095016", "quantity": 3, "price": "2500"},
    {"id": "P-NEW-174", "category": "Body Oil", "name": "Beauty White Vitamin C Serum", "barcode": "8853252008957", "quantity": 4, "price": "2000"},
    {"id": "P-NEW-175", "category": "Body Oil", "name": "Paw Paw White Oil Papaya", "barcode": "", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-176", "category": "Body Oil", "name": "Citroclear Serum Concentre", "barcode": "6182000100097", "quantity": 2, "price": "1700"},
    {"id": "P-NEW-177", "category": "Body Oil", "name": "Elixir Light Oil", "barcode": "8853252008957", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-178", "category": "Body Oil", "name": "Kojic White Plus Oil", "barcode": "6028050095511", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-179", "category": "Body Oil", "name": "Neoskin Essence-B Fast Action Lightening Body Oil", "barcode": "", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-180", "category": "Body Oil", "name": "Citroclear Concentrated Serum", "barcode": "682000160097", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-181", "category": "Body Oil", "name": "Piment Doux White", "barcode": "6028050095511", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-182", "category": "Body Oil", "name": "B.B. Clear Vitamin C Oil", "barcode": "6028050095115", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-183", "category": "Body Oil", "name": "Betasol Lotion", "barcode": "0108902292603162", "quantity": 7, "price": "1000"},
    {"id": "P-NEW-184", "category": "Body Oil", "name": "Sonia Double Distilled Glycerine Pure", "barcode": "", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-185", "category": "Body Oil", "name": "Nouvelle Oil", "barcode": "", "quantity": 3, "price": "300"},
    {"id": "P-NEW-186", "category": "Body Oil", "name": "Caro White Oil", "barcode": "61811005300701", "quantity": 1, "price": "1200"},
    {"id": "P-NEW-187", "category": "Body Oil", "name": "Visita Essence B Lightening Serum Oil", "barcode": "0714084875606", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-188", "category": "Body Oil", "name": "Xtract Clair", "barcode": "6181100238501", "quantity": 3, "price": "1000"},
    {"id": "P-NEW-189", "category": "Body Oil", "name": "Perfect Clinic", "barcode": "6156095368908", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-190", "category": "Body Oil", "name": "White Angel", "barcode": "", "quantity": 9, "price": "800"},
    {"id": "P-NEW-191", "category": "Body Oil", "name": "Paw Paw Papaya", "barcode": "6181100536515", "quantity": 5, "price": "1200"},
    {"id": "P-NEW-192", "category": "Body Oil", "name": "Animate Vitamin B", "barcode": "6977818370981", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-193", "category": "Body Oil", "name": "Clear Kpata-Kpata", "barcode": "731946512417", "quantity": 4, "price": "0"},
    {"id": "P-NEW-194", "category": "Body Oil", "name": "Piment Doux Lotion Clarifiante", "barcode": "6174000207296", "quantity": 3, "price": "1700"},
    {"id": "P-NEW-195", "category": "Body Oil", "name": "Super Sunblock Cleanser", "barcode": "31946512912", "quantity": 2, "price": "1300"},
    {"id": "P-NEW-196", "category": "Body Oil", "name": "Carotone Cleanser Lotion", "barcode": "6182000105184", "quantity": 3, "price": "1800"},
    {"id": "P-NEW-197", "category": "Body Oil", "name": "Neuskin Whitening Facial Cleanser BSC", "barcode": "", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-198", "category": "Body Oil", "name": "K Brothers Facial Cleanser", "barcode": "2000320150028", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-199", "category": "Body Oil", "name": "B.B. Clear Facial Cleanser", "barcode": "2000320150028", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-200", "category": "Body Oil", "name": "Visible Clear Cleanser", "barcode": "6009800434057", "quantity": 2, "price": "1500"},
    {"id": "P-NEW-201", "category": "Body Oil", "name": "D & L Antiseptic Cleanser", "barcode": "6156000016825", "quantity": 5, "price": "900"},
    {"id": "P-NEW-202", "category": "Body Oil", "name": "Babyface Facial Cleanser", "barcode": "4809010740793", "quantity": 2, "price": "2300"},
    {"id": "P-NEW-203", "category": "Body Oil", "name": "Babyface Facial Cleanser Small", "barcode": "", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-204", "category": "Bar Soap", "name": "Dodo Skin Gold BSC", "barcode": "", "quantity": 6, "price": "1000"},
    {"id": "P-NEW-205", "category": "Bar Soap", "name": "Derma Xtract BSC", "barcode": "", "quantity": 8, "price": "1000"},
    {"id": "P-NEW-206", "category": "Bar Soap", "name": "Gluta White BSC", "barcode": "6154000162603", "quantity": 7, "price": "1000"},
    {"id": "P-NEW-207", "category": "Bar Soap", "name": "Gbogbonise Skin Cream BSC", "barcode": "0180204479625", "quantity": 8, "price": "1000"},
    {"id": "P-NEW-208", "category": "Bar Soap", "name": "Olabact BSC", "barcode": "9747205439624", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-209", "category": "Bar Soap", "name": "Carotone Black Spot Corrector BSC", "barcode": "6182000104309", "quantity": 11, "price": "1200"},
    {"id": "P-NEW-210", "category": "Bar Soap", "name": "Olivera Cream BSC", "barcode": "6182000115626", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-211", "category": "Bar Soap", "name": "Paw Paw Papaya Dark Spot Remover", "barcode": "6181100537307", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-212", "category": "Bar Soap", "name": "Perfect Clinic BSC", "barcode": "6154000162832", "quantity": 4, "price": "1000"},
    {"id": "P-NEW-213", "category": "Bar Soap", "name": "White White BSC Black Spot Corrector", "barcode": "6154000364748", "quantity": 10, "price": "1000"},
    {"id": "P-NEW-214", "category": "Bar Soap", "name": "Dermaliss White", "barcode": "6154000162245", "quantity": 7, "price": "1000"},
    {"id": "P-NEW-215", "category": "Bar Soap", "name": "Jaune dReuf Egg Yolk", "barcode": "7319465128317", "quantity": 6, "price": "1300"},
    {"id": "P-NEW-216", "category": "Bar Soap", "name": "Visita Carrot BSC", "barcode": "731946512837", "quantity": 2, "price": "1000"},
    {"id": "P-NEW-217", "category": "Bar Soap", "name": "K Clair", "barcode": "", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-218", "category": "Bar Soap", "name": "Spotless", "barcode": "", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-219", "category": "Bar Soap", "name": "Too White", "barcode": "", "quantity": 6, "price": "2000"},
    {"id": "P-NEW-220", "category": "Bar Soap", "name": "Ashanti Face Beauty", "barcode": "5645344123029", "quantity": 4, "price": "2000"},
    {"id": "P-NEW-221", "category": "Bar Soap", "name": "Clear Kpata-Kpata", "barcode": "5645344123111", "quantity": 3, "price": "2000"},
    {"id": "P-NEW-222", "category": "Bar Soap", "name": "UV Lighting", "barcode": "8850716011157", "quantity": 2, "price": "500"},
    {"id": "P-NEW-223", "category": "Bar Soap", "name": "White Secret", "barcode": "6028050095313", "quantity": 4, "price": "1500"},
    {"id": "P-NEW-224", "category": "Bar Soap", "name": "Elixir Light Dark Spot Remover", "barcode": "", "quantity": 3, "price": "1500"},
    {"id": "P-NEW-225", "category": "Bar Soap", "name": "Clear Kpata-Kpata Sunblock", "barcode": "731946512271", "quantity": 4, "price": "1000"},
    {"id": "P-NEW-226", "category": "Bar Soap", "name": "Gluta Doux Concentree", "barcode": "6154000162856", "quantity": 6, "price": "1300"},
    {"id": "P-NEW-227", "category": "Bar Soap", "name": "White Glow Carrot Lightening Serum", "barcode": "52658733245037438", "quantity": 4, "price": "2500"},
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

        product = None
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
        ("api", "0008_import_cosmetics_stock"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
