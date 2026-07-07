from django.urls import path
from . import views

urlpatterns = [
    path('', views.section_list_create, name='section-list-create'),
    path('<int:pk>/', views.section_detail, name='section-detail'),
    path('type/<str:section_type>/', views.section_by_type, name='section-by-type'),
    path('slug/<slug:slug>/', views.section_by_slug, name='section-by-slug'),
]