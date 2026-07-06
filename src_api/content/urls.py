from django.urls import path
from . import views

urlpatterns = [
    path('', views.content_list_create, name='content-list-create'),
    path('<int:pk>/', views.content_detail, name='content-detail'),
    path('section/<int:section_id>/', views.content_by_section, name='content-by-section'),
]