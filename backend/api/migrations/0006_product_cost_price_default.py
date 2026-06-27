from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_optional_product_codes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="cost_price",
            field=models.DecimalField(db_column="costPrice", decimal_places=2, default=Decimal("0"), max_digits=12),
        ),
    ]
