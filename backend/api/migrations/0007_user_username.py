from django.db import migrations, models


def populate_usernames(apps, schema_editor):
    User = apps.get_model("api", "User")
    seen = set()
    for user in User.objects.all().order_by("created_at"):
        base = (user.email.split("@", 1)[0] if user.email else user.name).lower().replace(" ", "_") or "user"
        candidate = base
        index = 2
        while candidate in seen or User.objects.filter(username=candidate).exclude(pk=user.pk).exists():
            candidate = f"{base}_{index}"
            index += 1
        user.username = candidate
        user.save(update_fields=["username"])
        seen.add(candidate)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_product_cost_price_default"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="username",
            field=models.CharField(blank=True, max_length=150, null=True, unique=True),
        ),
        migrations.RunPython(populate_usernames, migrations.RunPython.noop),
    ]
