from django.urls import path
from . import views

urlpatterns = [
    path('external_media/', views.external_media_list_create, name='external_media_list_create'),
    path('external_media/<int:pk>/', views.external_media_detail, name='external_media_detail'),
    path('external_media_downloads/', views.external_media_download_list_create, name='external_media_download_list_create'),
    path('external_media_downloads/<int:pk>/', views.external_media_download_detail, name='external_media_download_detail'),
]
