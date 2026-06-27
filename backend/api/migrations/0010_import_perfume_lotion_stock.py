from decimal import Decimal

from django.db import migrations


PRODUCTS = [
    {"id": "P-NEW-228", "category": "Roll On", "name": "Cosmo Free Natural", "barcode": "6294015195804", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-229", "category": "Roll On", "name": "Visible White AB Smart", "barcode": "745760025374", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-230", "category": "Roll On", "name": "Evalona Super Dry", "barcode": "697777774526", "quantity": 1, "price": "1300"},
    {"id": "P-NEW-231", "category": "Roll On", "name": "Tom Ford Black Smart Collections", "barcode": "782706445681", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-232", "category": "Roll On", "name": "Cool Master For Man", "barcode": "6152110056973", "quantity": 12, "price": "2000"},
    {"id": "P-NEW-233", "category": "Roll On", "name": "Evalona Super Dry Teens", "barcode": "0697777774502", "quantity": 11, "price": "1300"},
    {"id": "P-NEW-234", "category": "Roll On", "name": "Evalona Super Dry Anti-Perspirant Deodorant Bold", "barcode": "697777774519", "quantity": 2, "price": "1300"},
    {"id": "P-NEW-235", "category": "Roll On", "name": "Evalona Super Dry Advance Protection For Men", "barcode": "697777774526", "quantity": 5, "price": "1300"},
    {"id": "P-NEW-236", "category": "Roll On", "name": "Passport Roll On", "barcode": "6154000070137", "quantity": 3, "price": "1000"},
    {"id": "P-NEW-237", "category": "Roll On", "name": "Sivop", "barcode": "6181100381832", "quantity": 1, "price": "0"},
    {"id": "P-NEW-238", "category": "Roll On", "name": "Nivea Men Black And White", "barcode": "4005900377005", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-239", "category": "Roll On", "name": "24K Roll On", "barcode": "6154000071888", "quantity": 7, "price": "1200"},
    {"id": "P-NEW-240", "category": "Roll On", "name": "Nivea Active Man", "barcode": "4005900088062", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-241", "category": "Roll On", "name": "Nivea Fresh Energy", "barcode": "4005900376954", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-242", "category": "Roll On", "name": "Nivea Man Deep", "barcode": "4005900663863", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-243", "category": "Roll On", "name": "Romano Classic", "barcode": "8935212810111", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-244", "category": "Roll On", "name": "Fogg For Men", "barcode": "6291012244139", "quantity": 2, "price": "2300"},
    {"id": "P-NEW-245", "category": "Roll On", "name": "Fantasy VIP", "barcode": "", "quantity": 7, "price": "1500"},
    {"id": "P-NEW-246", "category": "Roll On", "name": "Xplore", "barcode": "", "quantity": 5, "price": "1500"},
    {"id": "P-NEW-247", "category": "Roll On", "name": "Burt", "barcode": "6931638910369", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-248", "category": "Roll On", "name": "Venus Gold", "barcode": "6931638910376", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-249", "category": "Roll On", "name": "Malizia Classic", "barcode": "", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-250", "category": "Roll On", "name": "Baknour", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-251", "category": "Roll On", "name": "Cosmo Anti-Perspirant Adventure", "barcode": "6294015195606", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-252", "category": "Roll On", "name": "Cosmo Anti-Perspirant Project", "barcode": "6294015195576", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-253", "category": "Roll On", "name": "Cosmo Anti-Perspirant Natural", "barcode": "6294015195590", "quantity": 1, "price": "0"},
    {"id": "P-NEW-254", "category": "Roll On", "name": "Fresh Storm", "barcode": "", "quantity": 1, "price": "0"},
    {"id": "P-NEW-255", "category": "Roll On", "name": "Rexona", "barcode": "6151100134042", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-256", "category": "Roll On", "name": "Men Rexona Xtra Cool", "barcode": "6151100133960", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-257", "category": "Roll On", "name": "Billon Intense", "barcode": "630902422398", "quantity": 2, "price": "2000"},
    {"id": "P-NEW-258", "category": "Roll On", "name": "Sugar", "barcode": "3005820256740", "quantity": 7, "price": "2500"},
    {"id": "P-NEW-259", "category": "Roll On", "name": "64K", "barcode": "3421000099981", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-260", "category": "Roll On", "name": "24K White", "barcode": "6153001003052", "quantity": 5, "price": "2500"},
    {"id": "P-NEW-261", "category": "Roll On", "name": "24K Rouge", "barcode": "6153001003090", "quantity": 3, "price": "2500"},
    {"id": "P-NEW-262", "category": "Roll On", "name": "Acqua Di Vetyver", "barcode": "", "quantity": 5, "price": "2000"},
    {"id": "P-NEW-263", "category": "Roll On", "name": "Challenge", "barcode": "6154000038502", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-264", "category": "Roll On", "name": "2i2 Men VIP", "barcode": "6156000330402", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-265", "category": "Roll On", "name": "Malizia Classic VIP", "barcode": "", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-266", "category": "Roll On", "name": "Wave Collections Tahiti", "barcode": "6156000330402", "quantity": 4, "price": "3500"},
    {"id": "P-NEW-267", "category": "Roll On", "name": "Wave Collections Bahamas", "barcode": "6156000330501", "quantity": 3, "price": "3500"},
    {"id": "P-NEW-268", "category": "Roll On", "name": "Wave Collections Hawai", "barcode": "6156000330440", "quantity": 4, "price": "3500"},
    {"id": "P-NEW-269", "category": "Roll On", "name": "Hayaati Lattafa", "barcode": "6291107450193", "quantity": 2, "price": "23000"},
    {"id": "P-NEW-270", "category": "Roll On", "name": "Hayaati Lattafa Florence", "barcode": "6290360593180", "quantity": 1, "price": "23000"},
    {"id": "P-NEW-271", "category": "Roll On", "name": "Qahwa Lattafa", "barcode": "6291108732311", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-272", "category": "Roll On", "name": "Khamrah Lattafa", "barcode": "6976216089495", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-273", "category": "Roll On", "name": "Marque Pour Homme", "barcode": "6295124037870", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-274", "category": "Roll On", "name": "The Perfect Match Mousuf", "barcode": "6151100303257", "quantity": 2, "price": "7500"},
    {"id": "P-NEW-275", "category": "Roll On", "name": "Khamrah Dukhan Lattafa", "barcode": "6291108732335", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-276", "category": "Roll On", "name": "Memory Pour Homme", "barcode": "", "quantity": 2, "price": "7500"},
    {"id": "P-NEW-277", "category": "Roll On", "name": "Bond Elixer", "barcode": "022288509914", "quantity": 3, "price": "8500"},
    {"id": "P-NEW-278", "category": "Roll On", "name": "Bond Coldenoak", "barcode": "002228509969", "quantity": 3, "price": "8500"},
    {"id": "P-NEW-279", "category": "Roll On", "name": "808 Smart Collections", "barcode": "6291236920208", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-280", "category": "Roll On", "name": "64K Arts", "barcode": "2152000303433", "quantity": 5, "price": "5500"},
    {"id": "P-NEW-281", "category": "Roll On", "name": "64K Art Rouge Red Temptation", "barcode": "0029985021114", "quantity": 1, "price": "7000"},
    {"id": "P-NEW-282", "category": "Roll On", "name": "Vincent Pour Homme", "barcode": "6295124037917", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-283", "category": "Roll On", "name": "Noir Parris Oud Natural Spray", "barcode": "2152000303402", "quantity": 1, "price": "10000"},
    {"id": "P-NEW-284", "category": "Roll On", "name": "Sonique Pour Femme", "barcode": "6295124037894", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-285", "category": "Roll On", "name": "Alight", "barcode": "6295124037818", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-286", "category": "Roll On", "name": "Happy", "barcode": "615600012724", "quantity": 1, "price": "8500"},
    {"id": "P-NEW-287", "category": "Roll On", "name": "Tassori D Oriente Parfum 100M", "barcode": "555400098123479555", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-288", "category": "Roll On", "name": "Aventus Ble For Him", "barcode": "6936829003769", "quantity": 1, "price": "7000"},
    {"id": "P-NEW-289", "category": "Roll On", "name": "Mousuf Eau De Perfume", "barcode": "151100304281", "quantity": 4, "price": "5000"},
    {"id": "P-NEW-290", "category": "Roll On", "name": "Creed Aventus 4You", "barcode": "", "quantity": 1, "price": "7000"},
    {"id": "P-NEW-291", "category": "Roll On", "name": "Gold Seal Reflection", "barcode": "2698746211347", "quantity": 2, "price": "4500"},
    {"id": "P-NEW-292", "category": "Roll On", "name": "Deal Eau De Parfum", "barcode": "6156000070100", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-293", "category": "Roll On", "name": "Onleeu Eau De Parfum", "barcode": "6156000070124", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-294", "category": "Roll On", "name": "Celebrity", "barcode": "6154000071578", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-295", "category": "Roll On", "name": "World Of Fantasy", "barcode": "3551440202747", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-296", "category": "Roll On", "name": "Malezia VIP", "barcode": "0705632720691", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-297", "category": "Roll On", "name": "Night Walker", "barcode": "", "quantity": 4, "price": "2500"},
    {"id": "P-NEW-298", "category": "Roll On", "name": "Believe", "barcode": "6156000330556", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-299", "category": "Roll On", "name": "Chance", "barcode": "6154000332020", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-300", "category": "Roll On", "name": "Cotton Clus", "barcode": "6154000038762", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-301", "category": "Roll On", "name": "Black Gun", "barcode": "6156000197609", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-302", "category": "Roll On", "name": "Imperio Maker Pour Homme", "barcode": "7977700071452", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-303", "category": "Roll On", "name": "Y @ Y Parfum", "barcode": "", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-304", "category": "Roll On", "name": "Techno Sport", "barcode": "6154000038885", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-305", "category": "Roll On", "name": "Oxegene Parfum", "barcode": "", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-306", "category": "Roll On", "name": "Big Boss", "barcode": "6156000197531", "quantity": 4, "price": "3500"},
    {"id": "P-NEW-307", "category": "Roll On", "name": "136 Eau De Perfum", "barcode": "6156000197579", "quantity": 4, "price": "3500"},
    {"id": "P-NEW-308", "category": "Roll On", "name": "Cybele Passion", "barcode": "5285002321338", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-309", "category": "Roll On", "name": "Diplomatic", "barcode": "6154000071011", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-310", "category": "Roll On", "name": "Passport For Love Parfum", "barcode": "6154000071127", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-311", "category": "Roll On", "name": "Seduction", "barcode": "5265002321154", "quantity": 1, "price": "3000"},
    {"id": "P-NEW-312", "category": "Roll On", "name": "Iman", "barcode": "6154000332037", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-313", "category": "Roll On", "name": "Next Level", "barcode": "", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-314", "category": "Roll On", "name": "Prof Profesional", "barcode": "6154000038717", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-315", "category": "Hair Treatment", "name": "Cruset Natural Black Dye", "barcode": "8850407001115", "quantity": 8, "price": "1500"},
    {"id": "P-NEW-316", "category": "Hair Treatment", "name": "Orino Hair Color Dye", "barcode": "6954545122670", "quantity": 1, "price": "1500"},
    {"id": "P-NEW-317", "category": "Hair Treatment", "name": "Above Wine Red", "barcode": "6918101081276", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-318", "category": "Hair Treatment", "name": "Ebony Black Plus", "barcode": "799439311060", "quantity": 1, "price": "2000"},
    {"id": "P-NEW-319", "category": "Hair Treatment", "name": "Tovch Color", "barcode": "6970851162049", "quantity": 1, "price": "0"},
    {"id": "P-NEW-320", "category": "Hair Treatment", "name": "Subaru Hair Colorant", "barcode": "6951665460088", "quantity": 1, "price": "700"},
    {"id": "P-NEW-321", "category": "Hair Treatment", "name": "Splendide Parfum", "barcode": "6156000149271", "quantity": 2, "price": "6000"},
    {"id": "P-NEW-322", "category": "Hair Treatment", "name": "Choco Musk", "barcode": "6291110091642", "quantity": 4, "price": "4500"},
    {"id": "P-NEW-323", "category": "Hair Treatment", "name": "Passport For Love", "barcode": "6154000071127", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-324", "category": "Hair Treatment", "name": "New Plantyne", "barcode": "8029550000126", "quantity": 1, "price": "800"},
    {"id": "P-NEW-325", "category": "Hair Treatment", "name": "Above Hair Placement", "barcode": "6918101081993", "quantity": 1, "price": "800"},
    {"id": "P-NEW-326", "category": "Hair Treatment", "name": "Perfect Line Parfum", "barcode": "", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-327", "category": "Lotion Creams", "name": "Skin Doctor Paris Firming & Whitening Body Milk Vitamin C", "barcode": "291017777003", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-328", "category": "Lotion Creams", "name": "Skin Doctor Egyptian Glow", "barcode": "6154000125110", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-329", "category": "Lotion Creams", "name": "Skin Doctor Gluta Glow", "barcode": "6154000125189", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-330", "category": "Lotion Creams", "name": "Skin Doctor Premium Half Caste Glowing Lotion", "barcode": "3002459052361", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-331", "category": "Lotion Creams", "name": "Skin Doctor Premium Almond Oil", "barcode": "3002459052347", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-332", "category": "Lotion Creams", "name": "Skin Doctor Carrot Glow", "barcode": "6154000125172", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-333", "category": "Lotion Creams", "name": "Skin Doctor Orange Glow", "barcode": "513100041069", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-334", "category": "Lotion Creams", "name": "Skin Doctor Almond Injection Half Cast", "barcode": "2341136754466", "quantity": 3, "price": "5500"},
    {"id": "P-NEW-335", "category": "Lotion Creams", "name": "Skin Doctor Almond Oil", "barcode": "6154000225728", "quantity": 3, "price": "5500"},
    {"id": "P-NEW-336", "category": "Lotion Creams", "name": "Skin Doctor Paris Gluta Glow Face Cream Vitamin C", "barcode": "23212942200", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-337", "category": "Lotion Creams", "name": "Skin Aid Paris Almond Oil + Coconut Oil", "barcode": "6514000421557", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-338", "category": "Lotion Creams", "name": "Skin Aid Paris Collagen + Niacinamide", "barcode": "6154000421540", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-339", "category": "Lotion Creams", "name": "X7 Professional UV White, White Glow", "barcode": "2639830542220", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-340", "category": "Lotion Creams", "name": "KB 45 White Glow Half Cast", "barcode": "35621548223322", "quantity": 2, "price": "5500"},
    {"id": "P-NEW-341", "category": "Lotion Creams", "name": "KB 45 White Glow Ultra Whitening Body Lotion", "barcode": "35621548223322", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-342", "category": "Lotion Creams", "name": "UV White Carrot Clear Whitening Lotion", "barcode": "", "quantity": 2, "price": "5500"},
    {"id": "P-NEW-343", "category": "Lotion Creams", "name": "UV White Pure Whitening Milk Face And Body Care", "barcode": "6028050106934", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-344", "category": "Lotion Creams", "name": "UV Gold Strong Whitening Lotion Face And Body Care", "barcode": "", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-345", "category": "Lotion Creams", "name": "Skin Therapy Firming Face And Body Loton", "barcode": "6154003395633", "quantity": 4, "price": "5500"},
    {"id": "P-NEW-346", "category": "Lotion Creams", "name": "Skin Therapy Half Caste", "barcode": "6154003365636", "quantity": 3, "price": "5500"},
    {"id": "P-NEW-347", "category": "Lotion Creams", "name": "Skin Therapy Carrot", "barcode": "6154001225635", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-348", "category": "Lotion Creams", "name": "Active Cavier Drip Arbutin+Licorice", "barcode": "", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-349", "category": "Lotion Creams", "name": "Active Cavier Drip Vitamin C + Turmeric", "barcode": "", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-350", "category": "Lotion Creams", "name": "Fair Lady Half Glow Whitening Body Milk", "barcode": "1239874375993", "quantity": 3, "price": "10000"},
    {"id": "P-NEW-351", "category": "Lotion Creams", "name": "Fair Lady Xtra Whitening Body Milk", "barcode": "6296327434565", "quantity": 1, "price": "10000"},
    {"id": "P-NEW-352", "category": "Lotion Creams", "name": "UV White Pure Natural Whitening Milk", "barcode": "6028050105814", "quantity": 1, "price": "5500"},
    {"id": "P-NEW-353", "category": "Lotion Creams", "name": "Clear Dark Spot Vitamin C Glowing And Whitening Body Milk", "barcode": "6291476743452", "quantity": 1, "price": "6500"},
    {"id": "P-NEW-354", "category": "Lotion Creams", "name": "XXX Equitoria Wealty Glow Ultra Whitening Moistureising", "barcode": "6976009136726", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-355", "category": "Lotion Creams", "name": "Glow Olive Half-Caste Skin Whitening Lotion", "barcode": "1332434300005", "quantity": 4, "price": "6000"},
    {"id": "P-NEW-356", "category": "Lotion Creams", "name": "Glow Olive Vitamin C Xtra Whitening Lotion", "barcode": "1332434300111", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-357", "category": "Lotion Creams", "name": "Almond White Magic White Lotion Pure Organic", "barcode": "387588721085", "quantity": 3, "price": "5000"},
    {"id": "P-NEW-358", "category": "Lotion Creams", "name": "Almond White Exclusive White Lotion Pure Organic", "barcode": "220985463465", "quantity": 3, "price": "5000"},
    {"id": "P-NEW-359", "category": "Lotion Creams", "name": "Honey Tone Carrot Face And Body Skin Moistureizing & Lightening Lotion", "barcode": "6154000257491", "quantity": 3, "price": "8000"},
    {"id": "P-NEW-360", "category": "Lotion Creams", "name": "Snow White Strong Whitening Lotion", "barcode": "", "quantity": 1, "price": "10000"},
    {"id": "P-NEW-361", "category": "Lotion Creams", "name": "Easy Glow Pure Supreme Egyptian", "barcode": "6923257700278", "quantity": 1, "price": "9500"},
    {"id": "P-NEW-362", "category": "Lotion Creams", "name": "Premium Glow Half Cast Whitening Lotion Face & Body", "barcode": "1238626677736", "quantity": 1, "price": "10000"},
    {"id": "P-NEW-363", "category": "Lotion Creams", "name": "Facefacts Kojic Acid Body Lotion With Retinol", "barcode": "5031413945003", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-364", "category": "Lotion Creams", "name": "Glow Tone Vitamin C + Papaya Snail Mucin", "barcode": "8784034300238", "quantity": 1, "price": "8000"},
    {"id": "P-NEW-365", "category": "Lotion Creams", "name": "Glow Tone Carrot Extract", "barcode": "8784034300009", "quantity": 2, "price": "8000"},
    {"id": "P-NEW-366", "category": "Lotion Creams", "name": "Fair Glow Xtra Glow Vitamin C", "barcode": "9834278009219", "quantity": 1, "price": "9500"},
    {"id": "P-NEW-367", "category": "Lotion Creams", "name": "Fair Glow Niacinamide Face & Body Half Cast", "barcode": "285757948595", "quantity": 1, "price": "9500"},
    {"id": "P-NEW-368", "category": "Lotion Creams", "name": "Fair Glow 3X White Face & Body Xtra Whitening Blanchiment", "barcode": "285757535764", "quantity": 1, "price": "9500"},
    {"id": "P-NEW-369", "category": "Lotion Creams", "name": "Balance Glow Carrot White Intense Carrot & Marula Oil", "barcode": "122110001651", "quantity": 2, "price": "6000"},
    {"id": "P-NEW-370", "category": "Lotion Creams", "name": "Balance Glow Flawless White", "barcode": "1277800345658", "quantity": 2, "price": "6000"},
    {"id": "P-NEW-371", "category": "Lotion Creams", "name": "Balcance Glow Extreme White", "barcode": "1277800321324", "quantity": 1, "price": "6000"},
    {"id": "P-NEW-372", "category": "Lotion Creams", "name": "Victoria White Whitening Lotion", "barcode": "6154000162108", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-373", "category": "Lotion Creams", "name": "Pearls Immediate White", "barcode": "6154000162580", "quantity": 2, "price": "5000"},
    {"id": "P-NEW-374", "category": "Lotion Creams", "name": "Jargens Fair Natural Fairness Body Lotion", "barcode": "6922655060182", "quantity": 2, "price": "3500"},
    {"id": "P-NEW-375", "category": "Lotion Creams", "name": "Jargens Papaya", "barcode": "019100110199", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-376", "category": "Lotion Creams", "name": "Immediat White Gold Body Milk", "barcode": "2130302174159", "quantity": 2, "price": "5000"},
    {"id": "P-NEW-377", "category": "Lotion Creams", "name": "Immediat White Exclusive Body Milk", "barcode": "2130302174142", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-378", "category": "Lotion Creams", "name": "Disaar Brighten Body Lotion", "barcode": "1981682039658", "quantity": 1, "price": "2500"},
    {"id": "P-NEW-379", "category": "Lotion Creams", "name": "Disaar Carrot Super Whitening Skin Lotion", "barcode": "1981682041767", "quantity": 2, "price": "5000"},
    {"id": "P-NEW-380", "category": "Lotion Creams", "name": "Disaar Natural Collagen Hands & Body Lotion Vitamin E Avocado Oil", "barcode": "6932511228335", "quantity": 2, "price": "7000"},
    {"id": "P-NEW-381", "category": "Lotion Creams", "name": "VC Vitamin C", "barcode": "6932511218466", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-382", "category": "Lotion Creams", "name": "Collagen Snail Body Lotion", "barcode": "5060328891976", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-383", "category": "Lotion Creams", "name": "No Spot 3Riple Tone Carrot And Alpha Arbutin", "barcode": "731946512387", "quantity": 1, "price": "8500"},
    {"id": "P-NEW-384", "category": "Lotion Creams", "name": "No Spot Gold 24K Extra Whitening Body Milk", "barcode": "731946512660", "quantity": 1, "price": "8500"},
    {"id": "P-NEW-385", "category": "Lotion Creams", "name": "Easy Tone Natural And Coca Butter Body Lotion", "barcode": "6913475307533", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-386", "category": "Lotion Creams", "name": "Dr. Davey Arbutin Body Lotion", "barcode": "6921199120451", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-387", "category": "Lotion Creams", "name": "Dr. Davey Turmeric Body Lotion Soft And Smoother", "barcode": "6921199139200", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-388", "category": "Lotion Creams", "name": "Dr. Davey Kojic Acid Firmining & Hydration Body Lotion", "barcode": "6921199139187", "quantity": 2, "price": "5000"},
    {"id": "P-NEW-389", "category": "Lotion Creams", "name": "Dr. Davey Arbutin Body Lotion", "barcode": "6921199139217", "quantity": 3, "price": "5000"},
    {"id": "P-NEW-390", "category": "Lotion Creams", "name": "Dr. Davey Niacinamide Brighting And Glowing Body Lotion", "barcode": "6921199139224", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-391", "category": "Lotion Creams", "name": "Gluth One Injection Tomato Gluta", "barcode": "0988640082106", "quantity": 2, "price": "6000"},
    {"id": "P-NEW-392", "category": "Lotion Creams", "name": "V8 Gold Arbutin, Almond & Lighting Face And Body Lotion", "barcode": "6154000225353", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-393", "category": "Lotion Creams", "name": "V8 Gold Moroccan Argan Oil & L-Glutatione Lightening Face And Body Lotion", "barcode": "", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-394", "category": "Body Wash / Gel", "name": "Lemon Fresh Liquid Soap Carrot Oil Body Shower And Bath", "barcode": "6156000034935", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-395", "category": "Body Wash / Gel", "name": "Lemon Fresh Body Wash", "barcode": "745114123367", "quantity": 2, "price": "1000"},
    {"id": "P-NEW-396", "category": "Body Wash / Gel", "name": "Lemon Fresh Body Wash Extra Toning & Cleansing", "barcode": "745114123367", "quantity": 1, "price": "1000"},
    {"id": "P-NEW-397", "category": "Body Wash / Gel", "name": "Kids & More Bath & Shower Milk", "barcode": "472199415512", "quantity": 1, "price": "3500"},
    {"id": "P-NEW-398", "category": "Body Wash / Gel", "name": "Cosmo Temptation Strawberry Shower Gel", "barcode": "6294015121971", "quantity": 3, "price": "9500"},
    {"id": "P-NEW-399", "category": "Body Wash / Gel", "name": "Cosmo Temptation French Lavender Shower Gel", "barcode": "6294015122008", "quantity": 2, "price": "9500"},
    {"id": "P-NEW-400", "category": "Body Wash / Gel", "name": "Cosmo Body Wash Aloevera Shower Gel", "barcode": "6858475416055", "quantity": 3, "price": "9500"},
    {"id": "P-NEW-401", "category": "Body Wash / Gel", "name": "Abrico Derm", "barcode": "6181100321067", "quantity": 3, "price": "5500"},
    {"id": "P-NEW-402", "category": "Body Wash / Gel", "name": "O'Carly Turmeric Vitamin C Super Whitening Shower Gel", "barcode": "6973733912034", "quantity": 1, "price": "5000"},
    {"id": "P-NEW-403", "category": "Body Wash / Gel", "name": "White Glow Carrot Whitening Exfoliating Shower Gel", "barcode": "202154463872", "quantity": 1, "price": "7500"},
    {"id": "P-NEW-404", "category": "Body Wash / Gel", "name": "White Glow Visible Lighting & Clarifying Shower Gel", "barcode": "202154463872", "quantity": 2, "price": "7500"},
    {"id": "P-NEW-405", "category": "Body Wash / Gel", "name": "White Glow Pure Organic African Black Soap Body Wash With Papaya", "barcode": "202154213545", "quantity": 2, "price": "7500"},
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
        ("api", "0009_import_more_cosmetics_stock"),
    ]

    operations = [
        migrations.RunPython(import_products, migrations.RunPython.noop),
    ]
