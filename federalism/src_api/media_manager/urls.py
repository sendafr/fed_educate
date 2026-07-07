from django.urls import path
from . import views

urlpatterns = [
    # MediaUpload endpoints
    path('media_uploads/', views.media_upload_list_create, name='media_upload_list_create'),
    path('media_uploads/<int:pk>/', views.media_upload_detail, name='media_upload_detail'),
    path('media_uploads/<int:pk>/signed_url/', views.media_upload_signed_url, name='media_upload_signed_url'),
    path('media_uploads/<int:pk>/debug_signed_url/', views.debug_media_upload_signed_url, name='debug_media_upload_signed_url'),

    # Legacy compatibility aliases for older frontend builds
    path('media_upload/', views.media_upload_list_create, name='media_upload_list_create_legacy'),
    path('media_upload/<int:pk>/', views.media_upload_detail, name='media_upload_detail_legacy'),
    path('media_upload/<int:pk>/signed_url/', views.media_upload_signed_url, name='media_upload_signed_url_legacy'),

    # MediaFile endpoints
    path('media_file/', views.media_file_list_create, name='media_file_list_create'),
    path('media_file/<int:pk>/', views.media_file_detail, name='media_file_detail'),
    path('media_file/<int:pk>/signed_url/', views.media_file_signed_url, name='media_file_signed_url'),
    path('media_file/<int:pk>/debug_signed_url/', views.debug_media_file_signed_url, name='debug_media_file_signed_url'),

    # Legacy compatibility aliases for older frontend builds
    path('media_files/', views.media_file_list_create, name='media_files_list_create_legacy'),
    path('media_files/<int:pk>/', views.media_file_detail, name='media_files_detail_legacy'),
    path('media_files/<int:pk>/signed_url/', views.media_file_signed_url, name='media_files_signed_url_legacy'),

    # Category endpoints
    path('media_category/', views.media_category_list_create, name='media_category_list_create'),
    path('media_category/<int:pk>/', views.media_category_detail, name='media_category_detail'),
    path('media_category/<int:pk>/signed_url/', views.media_category_detail, name='media_category_detail_signed_url_legacy'),

    # Legacy category aliases for older frontend builds
    path('media_categorys/', views.media_category_list_create, name='media_category_list_create_legacy'),
    path('media_categorys/<int:pk>/', views.media_category_detail, name='media_category_detail_legacy'),

    # Tag endpoints
    path('media_tag/', views.media_tag_list_create, name='media_tag_list_create'),
    path('media_tag/<int:pk>/', views.media_tag_detail, name='media_tag_detail'),

    # Legacy tag aliases for older frontend builds
    path('media_tags/', views.media_tag_list_create, name='media_tag_list_create_legacy'),
    path('media_tags/<int:pk>/', views.media_tag_detail, name='media_tag_detail_legacy'),

    # Download endpoints
    path('media_download/', views.media_download_list_create, name='media_download_list_create'),
    path('media_download/<int:pk>/', views.media_download_detail, name='media_download_detail'),
    path('serve_media_file/<path:file_path>', views.serve_media_file, name='serve_media_file'),
    path('progress/<str:task_id>/', views.media_progress, name='media-progress'),
]