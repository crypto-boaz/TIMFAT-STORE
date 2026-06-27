from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_customerrequest"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="sku",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="product",
            name="serial_code",
            field=models.CharField("barcode", blank=True, db_column="serialCode", max_length=255, null=True, unique=True),
        ),
    ]
