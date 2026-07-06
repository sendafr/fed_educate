from django.db import models

from quiz.models import Quiz
from question.models import  Question
from users.models import User
#from django.contrib.auth.models import User
from fed_api.settings import AUTH_USER_MODEL
User = AUTH_USER_MODEL

# Create your models here.
class UserQuizResponse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user_answer = models.TextField()
    is_correct = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title}"
