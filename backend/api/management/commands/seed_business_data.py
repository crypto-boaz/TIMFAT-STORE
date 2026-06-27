import os
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import (
    Category,
    Customer,
    CustomerRequest,
    Debt,
    Delivery,
    Expense,
    InventoryLog,
    Notification,
    Payment,
    Product,
    Report,
    Sale,
    SaleItem,
    Supplier,
)


class Command(BaseCommand):
    help = "Load the exported Kingstore business data fixture into the current database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fixture",
            default="kingstore_seed.json",
            help="Fixture filename or path. Defaults to api/fixtures/kingstore_seed.json.",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Delete existing business records before loading the fixture. Users/admin accounts are preserved.",
        )

    def handle(self, *args, **options):
        seed_enabled = os.environ.get("PAYTRACK_ENABLE_BUSINESS_SEED", "").strip().lower() in {"1", "true", "yes", "on"}
        if not settings.DEBUG and not seed_enabled:
            self.stdout.write(self.style.WARNING("Business seed skipped. Set PAYTRACK_ENABLE_BUSINESS_SEED=true to run it in production."))
            return

        fixture = options["fixture"]
        if not Path(fixture).is_file():
            fixture = str(Path(__file__).resolve().parents[2] / "fixtures" / fixture)

        if not Path(fixture).is_file():
            raise RuntimeError(f"Business seed fixture not found: {fixture}")

        with transaction.atomic():
            if options["replace"]:
                self._clear_business_data()
            call_command("loaddata", fixture, verbosity=0)

        self.stdout.write(self.style.SUCCESS(f"Loaded business seed fixture: {fixture}"))

    def _clear_business_data(self):
        for model in [
            Payment,
            Debt,
            SaleItem,
            Sale,
            InventoryLog,
            Product,
            Delivery,
            Supplier,
            CustomerRequest,
            Expense,
            Report,
            Notification,
            Customer,
            Category,
        ]:
            model.objects.all().delete()
