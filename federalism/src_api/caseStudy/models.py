from django.db import models

class CaseStudy(models.Model):
    title = models.CharField(max_length=300)
    country = models.CharField(max_length=100)
    description = models.TextField()
    key_points = models.JSONField(default=list)
    image = models.ImageField(upload_to='case_studies/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.country}"