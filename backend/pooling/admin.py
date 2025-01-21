from common.admin import ArchivedFilter
from django.contrib import admin

from .models import Pooling


@admin.register(Pooling)
class PoolingAdmin(admin.ModelAdmin):
    list_filter = (ArchivedFilter,)
    list_display = ("name", "barcode", "request", "pool", "archived")
    search_fields = (
        "library__name",
        "library__barcode",
        "sample__name",
        "sample__barcode",
    )
    autocomplete_fields = (
        "library",
        "sample",
        "pool",
    )
    list_select_related = True

    actions = (
        "mark_as_archived",
        "mark_as_non_archived",
    )

    @admin.action(description="Mark as archived")
    def mark_as_archived(self, request, queryset):
        queryset.update(archived=True)

    @admin.action(description="Mark as non-archived")
    def mark_as_non_archived(self, request, queryset):
        queryset.update(archived=False)

    def name(self, obj):
        instance = obj.library if obj.library else obj.sample
        return instance.name

    def barcode(self, obj):
        instance = obj.library if obj.library else obj.sample
        return instance.barcode

    def request(self, obj):
        instance = obj.library if obj.library else obj.sample
        return instance.request.get().name

