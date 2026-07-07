from django.db import models

# Create your models here.
class Section(models.Model):
    SECTION_CHOICES = [
        ('what_is', 'What is Federalism?'),
        ('benefits', 'Benefits'),
        ('drawbacks', 'Drawbacks'),
        ('comparisons', 'Comparisons'),
        ('case_studies', 'Case Studies'),
        ('quiz', 'Quiz/Assessment'),
    ]
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    section_type = models.CharField(max_length=20, choices=SECTION_CHOICES)
    description = models.TextField()
    order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title
