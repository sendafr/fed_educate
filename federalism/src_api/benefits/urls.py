from django.urls import path
from . import views

urlpatterns = [
    path('', views.benefit_list_create, name='benefit-list-create'),
    path('<int:pk>/', views.benefit_detail, name='benefit-detail'),
    path('category/<str:category>/', views.benefit_by_category, name='benefit-by-category'),
]