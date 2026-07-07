from django.urls import path
from . import views

urlpatterns = [
    path('', views.comparison_list_create, name='comparison-list-create'),
    path('<int:pk>/', views.comparison_detail, name='comparison-detail'),
    path('type/<str:system_type>/', views.comparison_by_type, name='comparison-by-type'),
]