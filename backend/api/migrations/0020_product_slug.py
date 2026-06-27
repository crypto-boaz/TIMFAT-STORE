from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0019_user_profile_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="slug",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
