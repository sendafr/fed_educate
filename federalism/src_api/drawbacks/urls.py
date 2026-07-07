from django.urls import path
from . import views

urlpatterns = [
    path('', views.drawback_list_create, name='drawback-list-create'),
    path('<int:pk>/', views.drawback_detail, name='drawback-detail'),
    path('category/<str:category>/', views.drawback_by_category, name='drawback-by-category'),
    path('severity/<str:severity>/', views.drawback_by_severity, name='drawback-by-severity'),
]