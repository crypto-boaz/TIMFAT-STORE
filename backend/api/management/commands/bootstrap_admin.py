import os

import bcrypt
from django.contrib.auth.models import User as AdminUser
from django.core.management.base import BaseCommand
from django.db.models import Q

from api.models import Role, User


class Command(BaseCommand):
    help = "Create or update the production admin user from environment variables."

    def handle(self, *args, **options):
        email = os.environ.get("PAYTRACK_ADMIN_EMAIL", "").strip().lower()
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin").strip() or "admin"
        name = os.environ.get("PAYTRACK_ADMIN_NAME", "System Admin").strip() or "System Admin"
        password = os.environ.get("PAYTRACK_ADMIN_PASSWORD") or os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")

        if not email:
            raise RuntimeError("Set PAYTRACK_ADMIN_EMAIL before running bootstrap_admin.")
        if len(password) < 12:
            raise RuntimeError("Set PAYTRACK_ADMIN_PASSWORD to at least 12 characters before running bootstrap_admin.")

        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        app_user = User.objects.filter(Q(username__iexact=username) | Q(email__iexact=email)).first()
        if app_user is None:
            app_user = User(username=username)

        app_user.username = username
        app_user.email = email
        app_user.name = name
        app_user.password_hash = password_hash
        app_user.role = Role.ADMIN
        app_user.active = True
        app_user.save()

        admin, _ = AdminUser.objects.get_or_create(username=username, defaults={"email": email})
        admin.email = email
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password(password)
        admin.save()

        self.stdout.write(self.style.SUCCESS(f"Bootstrapped admin user {email} and Django superuser {username}."))