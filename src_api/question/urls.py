from django.urls import path
from . import views

urlpatterns = [
    path('', views.question_list_create, name='question-list-create'),
    path('<int:pk>/', views.question_detail, name='question-detail'),
    
     # Optional: Get all questions for a specific quiz
    path('quiz/<int:quiz_id>/', views.question_by_quiz, name='question-by-quiz'),
]