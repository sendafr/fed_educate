
from django.db import models
from section.models import Section



class Content(models.Model):

    CONTENT_TYPE_CHOICES = [
        ('text', 'Text'),
        ('video', 'Video'),
        ('image', 'Image'),
        ('infographic', 'Infographic'),
        ('chart', 'Chart'),
        ('map', 'Map'),
        ('documentary', 'Documentary'),
    ]
    
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=300)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    description = models.TextField(blank=True)
    text_content = models.TextField(blank=True)
    media_url = models.URLField(blank=True)
    media_file = models.FileField(upload_to='content_media/', blank=True)
    order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title
