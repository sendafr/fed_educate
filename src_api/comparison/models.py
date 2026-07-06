from django.db import models

# Create your models here.
class Comparison(models.Model):
    GOVERNANCE_SYSTEMS = [
        ('unitary', 'Unitary System'),
        ('confederal', 'Confederal System'),
        ('centralized', 'Centralized System'),
    ]
    
    system_type = models.CharField(max_length=20, choices=GOVERNANCE_SYSTEMS)
    title = models.CharField(max_length=300)
    description = models.TextField()
    advantages = models.JSONField(default=list)
    disadvantages = models.JSONField(default=list)
    examples = models.JSONField(default=list)  # Countries using this system

    def __str__(self):
        return self.title
