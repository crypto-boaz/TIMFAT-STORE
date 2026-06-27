from django.db import migrations
from django.utils.text import slugify


def populate_product_slugs(apps, schema_editor):
    Product = apps.get_model("api", "Product")
    for product in Product.objects.only("id", "name", "slug").iterator(chunk_size=500):
        generated_slug = slugify(product.name)
        if product.slug != generated_slug:
            Product.objects.filter(id=product.id).update(slug=generated_slug)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0020_product_slug"),
    ]

    operations = [
        migrations.RunPython(populate_product_slugs, migrations.RunPython.noop),
    ]
