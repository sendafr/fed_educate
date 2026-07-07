from django.urls import path
from . import views

urlpatterns = [
    path('', views.case_study_list_create, name='case_study_list_create'),
    path('country/<str:country>/', views.case_study_by_country, name='case-study-by-country'),

    path('case_study/<int:pk>/', views.case_study_detail, name='case-study-detail'),
]
    