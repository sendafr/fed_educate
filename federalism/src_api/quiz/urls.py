from django.urls import path
from . import views

urlpatterns = [
    path('', views.quiz_list_create, name='quiz-list-create'),
    path('<int:pk>/', views.quiz_detail, name='quiz-detail'),
    path('section/<int:section_id>/', views.quiz_by_section, name='quiz-by-section'),
]