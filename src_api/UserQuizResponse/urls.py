from django.urls import path
from . import views

urlpatterns = [
    path('', views.user_quiz_response_list_create, name='user-quiz-response-list-create'),
    path('<int:pk>/', views.user_quiz_response_detail, name='user-quiz-response-detail'),
    path('quiz/<int:quiz_id>/statistics/', views.quiz_statistics, name='quiz-statistics'),
    path('attempts/', views.user_quiz_attempts, name='user-quiz-attempts'),
    path('quiz/<int:quiz_id>/', views.responses_by_quiz, name='responses-by-quiz'),
]