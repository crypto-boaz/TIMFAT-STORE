from django.urls import path

from . import views


urlpatterns = [
    path("health", views.health),
    path("business-data", views.business_snapshot),
    path("auth/login", views.login),
    path("auth/register", views.register),
    path("auth/supabase-session", views.supabase_session),
    path("auth/me", views.me),
    path("users", views.users),
    path("users/<str:user_id>", views.user_detail),
    path("dashboard", views.dashboard),
    path("products", views.products),
    path("products/sync", views.product_sync),
    path("products/bulk-sync", views.products_bulk_sync),
    path("products/<str:product_id>/history", views.product_history),
    path("products/<str:product_id>", views.product_detail),
    path("categories", views.categories),
    path("customers", views.customers),
    path("sales", views.sales),
    path("debts", views.debts),
    path("debts/<str:debt_id>", views.debt_detail),
    path("suppliers", views.suppliers),
    path("expenses", views.expenses),
    path("payments", views.payments),
    path("notifications", views.notifications),
    path("reports/<str:report_type>", views.reports),
]
