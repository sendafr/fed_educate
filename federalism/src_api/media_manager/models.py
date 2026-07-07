
from django.db import models
import mimetypes
from django.core.exceptions import ValidationError
from fed_api.settings import AUTH_USER_MODEL
User = AUTH_USER_MODEL

class MediaUpload(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('video', 'Video'),
        ('image', 'Image'),
        ('document', 'Document'),
        ('documentary', 'Documentary'),
        ('map', 'Map'),
        ('studycase', 'Study Case'),
        ('audio', 'Audio'),
        ('infographic', 'Infographic'),
    ]
    # ADD THIS FIELD
    PROCESSING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='media_uploads')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    title = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/%d/', blank=True, null=True)
    duration = models.IntegerField(null=True, blank=True)  # For videos, in seconds
    file_size = models.BigIntegerField(null=True, blank=True)  # File size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['user', '-uploaded_at']),
            models.Index(fields=['media_type', 'is_public']),
        ]
    
    def __str__(self):
        return f"{self.title or self.file.name} ({self.media_type})"
    
    def get_file_size_mb(self):
        """Return file size in MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return None


class MediaCategory(models.Model):
    """Categories for organizing media"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For emoji or icon class
    
    class Meta:
        verbose_name_plural = "Media Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class MediaTag(models.Model):
    """Tags for media files"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class MediaFile(models.Model):
    """Extended media model with categories and tags"""
    MEDIA_TYPE_CHOICES = [
        ('video', 'Video'),
        ('image', 'Image'),
        ('document', 'Document'),
        ('documentary', 'Documentary'),
        ('map', 'Map'),
        ('studycase', 'Study Case'),
        ('audio', 'Audio'),
        ('infographic', 'Infographic'),
        ('chart', 'Chart'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='media_files')
    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    file = models.FileField(upload_to='media_files/%Y/%m/%d/')
    thumbnail = models.ImageField(upload_to='media_thumbnails/%Y/%m/%d/', blank=True, null=True)
    
    # Metadata
    category = models.ForeignKey(MediaCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='media_files')
    tags = models.ManyToManyField(MediaTag, blank=True, related_name='media_files')
    duration = models.IntegerField(null=True, blank=True)  # For videos, in seconds
    file_size = models.BigIntegerField(null=True, blank=True)  # File size in bytes
    
    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Analytics
    views_count = models.IntegerField(default=0)
    downloads_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['media_type', 'status']),
            models.Index(fields=['is_featured', '-created_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_file_size_mb(self):
        """Return file size in MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return None
    
    def get_duration_formatted(self):
        """Return formatted duration for videos"""
        if self.duration:
            minutes = self.duration // 60
            seconds = self.duration % 60
            return f"{minutes}:{seconds:02d}"
        return None

    

    def clean(self):
        super().clean()
        if self.file:
            # Get MIME type
            mime_type, _ = mimetypes.guess_type(self.file.name)
            
            # Define allowed MIME types per media_type
            allowed_types = {
                'video': ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
                'image': ['image/jpeg', 'image/png', 'image/gif'],
                'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                # Add others as needed
            }
            
            if self.media_type in allowed_types:
                if mime_type not in allowed_types[self.media_type]:
                    raise ValidationError(
                        f"File type '{mime_type}' is not allowed for media type '{self.media_type}'."
                    )


class MediaDownload(models.Model):
    """Track media downloads"""
    media = models.ForeignKey(MediaFile, on_delete=models.CASCADE, related_name='downloads')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    downloaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-downloaded_at']
    
    def __str__(self):
        return f"{self.media.title} - {self.downloaded_at}"
