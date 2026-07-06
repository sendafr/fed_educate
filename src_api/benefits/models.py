from django.db import models

# Create your models here.


class Benefits(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=[
            ('political', 'Political'),
            ('economic', 'Economic'),
            ('social', 'Social'),
            ('administrative', 'Administrative'),
        ],
        default='political'
    )
    icon = models.CharField(max_length=50, blank=True)  # For emoji or icon class
    order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name_plural = "Benefits"

    def __str__(self):
        return self.title