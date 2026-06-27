from django.contrib import admin

from .models import (
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
    User,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "name", "email", "role", "active", "created_at")
    search_fields = ("username", "name", "email")
    list_filter = ("role", "active")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "barcode", "quantity", "selling_price", "category", "supplier")
    search_fields = ("name", "sku", "serial_code")
    list_filter = ("category", "supplier")
    exclude = ("cost_price",)

    @admin.display(description="Barcode")
    def barcode(self, product):
        return product.serial_code or ""


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("invoice_no", "customer", "total", "amount_paid", "status", "created_at")
    search_fields = ("invoice_no", "customer__name")
    list_filter = ("status", "payment_method")


admin.site.register(Category)
admin.site.register(Customer)
admin.site.register(CustomerRequest)
admin.site.register(SaleItem)
admin.site.register(Debt)
admin.site.register(Supplier)
admin.site.register(Delivery)
admin.site.register(Expense)
admin.site.register(Payment)
admin.site.register(InventoryLog)
admin.site.register(Report)
admin.site.register(Notification)
