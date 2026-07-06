from django.contrib import admin
from .models import MediaUpload, MediaCategory, MediaTag, MediaFile, MediaDownload

@admin.register(MediaUpload)
class MediaUploadAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'media_type', 'is_public', 'uploaded_at', 'views_count']
    list_filter = ['media_type', 'is_public', 'uploaded_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['uploaded_at', 'updated_at', 'views_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description', 'media_type')
        }),
        ('File Information', {
            'fields': ('file', 'thumbnail', 'duration', 'file_size')
        }),
        ('Visibility', {
            'fields': ('is_public',)
        }),
        ('Analytics', {
            'fields': ('views_count', 'uploaded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MediaCategory)
class MediaCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(MediaTag)
class MediaTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'media_type', 'status', 'is_featured', 'created_at', 'views_count']
    list_filter = ['media_type', 'status', 'is_featured', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['slug', 'created_at', 'updated_at', 'published_at', 'views_count', 'downloads_count']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['tags']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'slug', 'description', 'media_type')
        }),
        ('File Information', {
            'fields': ('file', 'thumbnail', 'duration', 'file_size')
        }),
        ('Organization', {
            'fields': ('category', 'tags')
        }),
        ('Status & Visibility', {
            'fields': ('status', 'is_featured', 'published_at')
        }),
        ('Analytics', {
            'fields': ('views_count', 'downloads_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MediaDownload)
class MediaDownloadAdmin(admin.ModelAdmin):
    list_display = ['media', 'user', 'ip_address', 'downloaded_at']
    list_filter = ['downloaded_at', 'media__media_type']
    search_fields = ['media__title', 'user__username', 'ip_address']
    readonly_fields = ['downloaded_at']
    
    def has_add_permission(self, request):
        return False