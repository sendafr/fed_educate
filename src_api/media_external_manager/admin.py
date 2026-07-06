from django.contrib import admin
from .models import ExternalMedia, ExternalMediaDownload


@admin.register(ExternalMedia)
class ExternalMediaAdmin(admin.ModelAdmin):
    list_display = ('title', 'source_type', 'media_type', 'user', 'status', 'is_featured', 'created_at')
    list_filter = ('source_type', 'media_type', 'status', 'is_featured')
    search_fields = ('title', 'external_url', 'external_id', 'description')


@admin.register(ExternalMediaDownload)
class ExternalMediaDownloadAdmin(admin.ModelAdmin):
    list_display = ('media', 'user', 'ip_address', 'downloaded_at')
    list_filter = ('user',)
    search_fields = ('media__title', 'ip_address')
