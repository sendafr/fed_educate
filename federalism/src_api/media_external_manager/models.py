from django.db import models
from fed_api.settings import AUTH_USER_MODEL
User = AUTH_USER_MODEL


class ExternalMedia(models.Model):
    SOURCE_CHOICES = [
        ('youtube', 'YouTube'),
        ('google_drive', 'Google Drive'),
        ('facebook', 'Facebook'),
        ('vimeo', 'Vimeo'),
        ('tiktok', 'TikTok'),
        ('other', 'Other'),
    ]

    MEDIA_TYPE_CHOICES = [
        ('video', 'Video'),
        ('image', 'Image'),
        ('document', 'Document'),
        ('documentary', 'Documentary'),
        ('map', 'Map'),
        ('studycase', 'Study Case'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='external_media')
    source_type = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    media_type = models.CharField(
        max_length=20,
        choices=MEDIA_TYPE_CHOICES,
        default='other'
    )
    external_id = models.CharField(max_length=255, blank=True, null=True)
    external_url = models.URLField(max_length=1024)
    embed_url = models.URLField(max_length=1024, blank=True, null=True)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    thumbnail_url = models.URLField(max_length=1024, blank=True, null=True)
    duration = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    views_count = models.IntegerField(default=0)
    downloads_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['source_type', 'status']),
            models.Index(fields=['media_type', 'status']),
        ]

    def __str__(self):
        return f"{self.title} ({self.source_type})"

    def get_duration_formatted(self):
        if self.duration:
            minutes = self.duration // 60
            seconds = self.duration % 60
            return f"{minutes}:{seconds:02d}"
        return None


class ExternalMediaDownload(models.Model):
    media = models.ForeignKey(ExternalMedia, on_delete=models.CASCADE, related_name='downloads')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    downloaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-downloaded_at']

    def __str__(self):
        return f"{self.media.title} - {self.downloaded_at}"
