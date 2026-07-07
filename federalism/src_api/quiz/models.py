from django.db import models
from section.models import Section

# Create your models here.
class Quiz(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('fill_blank', 'Fill in the Blank'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    ]
    
    title = models.CharField(max_length=300)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='quizzes')
    difficulty = models.CharField(max_length=20, choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')])
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
