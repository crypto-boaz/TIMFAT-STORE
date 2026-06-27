from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0018_import_makeup_hair_stock"),
        ("api", "0018_store_alter_category_name_alter_product_serial_code_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="first_name",
            field=models.CharField(blank=True, db_column="firstName", default="", max_length=120),
        ),
        migrations.AddField(
            model_name="user",
            name="last_name",
            field=models.CharField(blank=True, db_column="lastName", default="", max_length=120),
        ),
        migrations.AddField(
            model_name="user",
            name="gender",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
        migrations.AddField(
            model_name="user",
            name="company_name",
            field=models.CharField(blank=True, db_column="companyName", default="", max_length=255),
        ),
        migrations.AddField(
            model_name="user",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
    ]
