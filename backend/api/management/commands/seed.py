import os

import bcrypt
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User as AdminUser

from api.models import Role, User


class Command(BaseCommand):
    help = "Seed the Django database with PayTrack login users only."

    def handle(self, *args, **options):
        password = os.environ.get("PAYTRACK_SEED_PASSWORD", "")
        allow_default_password = os.environ.get("PAYTRACK_ALLOW_DEFAULT_PASSWORDS", "").strip().lower() in {"1", "true", "yes", "on"}
        if settings.DEBUG and "PAYTRACK_ALLOW_DEFAULT_PASSWORDS" not in os.environ:
            allow_default_password = True
        if not password and allow_default_password:
            password = "password123"
        if len(password) < 12 and not settings.DEBUG:
            raise RuntimeError("Set PAYTRACK_SEED_PASSWORD to at least 12 characters before seeding production.")
        if password == "password123" and not allow_default_password:
            raise RuntimeError("Default seed passwords are disabled. Set PAYTRACK_SEED_PASSWORD.")

        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        users = [
            ("admin", "admin@kingsstore.local", "System Admin", Role.ADMIN),
            ("staff", "staff@kingsstore.local", "Sales Staff", Role.STAFF),
            ("accountant", "accountant@kingsstore.local", "Accountant", Role.ACCOUNTANT),
            ("records", "records@kingsstore.local", "Warehouse Records", Role.WAREHOUSE),
        ]

        for username, email, name, role in users:
            User.objects.update_or_create(
                username=username,
                defaults={
                    "email": email,
                    "name": name,
                    "password_hash": password_hash,
                    "role": role,
                    "active": True,
                },
            )

        admin, _ = AdminUser.objects.get_or_create(username="admin", defaults={"email": "admin@kingsstore.local"})
        admin.email = "admin@kingsstore.local"
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password(password)
        admin.save()

        self.stdout.write(self.style.SUCCESS("Seeded PayTrack users and Django Admin. Business data remains empty."))
