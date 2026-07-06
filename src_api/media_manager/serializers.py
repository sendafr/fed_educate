from rest_framework import serializers
from .models import MediaUpload, MediaCategory, MediaTag, MediaFile, MediaDownload
from django.conf import settings
from django.urls import reverse
from django.utils.text import slugify
import boto3
from botocore.client import Config


def generate_presigned_object_url(file_field):
    if not file_field:
        return None

    try:
        url = file_field.url
    except Exception:
        url = None

    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
    endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
    aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
    aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
    aws_region = getattr(settings, 'AWS_S3_REGION_NAME', getattr(settings, 'AWS_S3_REGION', None)) or 'eu-west-1'

    if not all([bucket, endpoint_url, aws_access_key, aws_secret_key, aws_region]):
        return url

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region,
            endpoint_url=endpoint_url,
            config=Config(signature_version='s3v4', region_name=aws_region),
        )

        key = getattr(file_field, 'name', None)
        if not key:
            return url

        return s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=300,
        )
    except Exception:
        return url

# ─── MediaUpload Serializer ────────────────────────────────────────────────────
class MediaUploadSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    file_url = serializers.SerializerMethodField()  # NEW: Full URL for playback
    thumbnail_url = serializers.SerializerMethodField()  # NEW: Full URL for thumbnail

    class Meta:
        model = MediaUpload
        fields = [
            'id', 'user', 'user_username', 'media_type', 'file', 'file_url', 'title', 
            'description', 'thumbnail', 'thumbnail_url', 'duration', 'file_size', 
            'file_size_mb', 'uploaded_at', 'updated_at', 'is_public', 'views_count', 
            'duration_formatted', 'status'
        ]
        read_only_fields = [
            'user', 'uploaded_at', 'updated_at', 'views_count', 'user_username', 
            'file_url', 'thumbnail_url', 'status'
        ]

    def get_file_size_mb(self, obj):
        return obj.get_file_size_mb()

    def get_duration_formatted(self, obj):
        if obj.duration:
            minutes = obj.duration // 60
            seconds = obj.duration % 60
            return f"{minutes}:{seconds:02d}"
        return None
    
 
    
    def get_file(self, obj):
        return generate_presigned_object_url(obj.file)

    def get_thumbnail(self, obj):
        return generate_presigned_object_url(obj.thumbnail)

    def get_file_url(self, obj):
        return generate_presigned_object_url(obj.file)

    def get_thumbnail_url(self, obj):
        return generate_presigned_object_url(obj.thumbnail)

   
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
# ─── MediaCategory Serializer ─────────────────────────────────────────────────
class MediaCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaCategory
        fields = ['id', 'name', 'slug', 'description', 'icon']


# ─── MediaFile Serializer (Create/Update) ─────────────────────────────────────
"""class MediaFileCreateUpdateSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=MediaTag.objects.all(),
        many=True,
        required=False,
        write_only=True,
        source='tags'
    )
    file = serializers.FileField(required=False, allow_null=True)
    thumbnail = serializers.ImageField(required=False, allow_null=True)
    # If you have a URL field
    url = serializers.SerializerMethodField()

    def get_url(self, obj):
        try:
            return obj.file.url
        except Exception:
            return None
    
    

    class Meta:
        model = MediaFile
        fields = [

             'id', 'title', 'url', 'description', 'media_type', 'file', 'thumbnail',
            'category_id', 'tag_ids', 'duration', 'status',
            'is_featured'
        ]"""

    
    
from django.utils.text import slugify

class MediaFileCreateUpdateSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(write_only=True, required=False)
    tags = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = MediaFile
        fields = ['id', 'file', 'title', 'category_id', 'tags', 'slug', 'status']
        read_only_fields = ['id', 'slug', 'status']

    def validate_title(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_media_type(self, value):
        valid_types = ['video', 'image', 'document', 'documentary', 'map', 'studycase', 'audio', 'infographic', 'chart']
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid media type. Must be one of: {', '.join(valid_types)}")
        return value



    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        
        category_id = validated_data.pop('category_id', None)
        tag_ids = validated_data.pop('tags', [])

        # Auto slug from title
        if not validated_data.get('slug'):
            base_slug = slugify(validated_data.get('title', 'media-file'))
            slug = base_slug
            counter = 1
            while MediaFile.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug

        # Create the object first
        media_file = MediaFile.objects.create(**validated_data)

        # Set FK and M2M after create
        if category_id:
            media_file.category_id = category_id
            media_file.save()
            
        if tag_ids:
            media_file.tags.set(tag_ids) # assuming tags is M2M

        return media_file


    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        tags = validated_data.pop('tags', None)
        
        # Don't overwrite file/thumbnail if None (when not changing them)
        if 'file' in validated_data and validated_data['file'] is None:
            validated_data.pop('file')
        if 'thumbnail' in validated_data and validated_data['thumbnail'] is None:
            validated_data.pop('thumbnail')

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if category_id is not None:
            instance.category_id = category_id
        elif 'category_id' in self.initial_data and self.initial_data['category_id'] is None:
            instance.category_id = None

        instance.save()

        if tags is not None:
            instance.tags.set(tags)

        return instance
    

# ─── MediaDownload Serializer ─────────────────────────────────────────────────
class MediaDownloadSerializer(serializers.ModelSerializer):
    media_title = serializers.CharField(source='media.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        #model = MediaDownload
        fields = ['id', 'media', 'media_title', 'user', 'user_username', 'ip_address', 'downloaded_at']
        read_only_fields = ['user', 'downloaded_at', 'user_username']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# ─── MediaTag Serializer ──────────────────────────────────────────────────────
class MediaTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaTag
        fields = ['id', 'name', 'slug']




# ─── MediaFile Serializer (Read) ──────────────────────────────────────────────
class MediaFileSerializer(serializers.ModelSerializer):
    category = MediaCategorySerializer(read_only=True)
    tags = MediaTagSerializer(many=True, read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    file_url = serializers.SerializerMethodField()  # NEW
    thumbnail_url = serializers.SerializerMethodField()  # NEW

    class Meta:
        model = MediaFile
        fields = [
            'id', 'user', 'user_username', 'title', 'slug', 'description',
            'media_type', 'file', 'file_url', 'thumbnail', 'thumbnail_url', 
            'category', 'tags', 'duration', 'file_size', 'file_size_mb', 
            'status', 'is_featured', 'created_at', 'updated_at', 'published_at', 
            'views_count', 'downloads_count', 'duration_formatted'
        ]
        read_only_fields = [
            'user', 'slug', 'created_at', 'updated_at', 'views_count',
            'downloads_count', 'published_at', 'user_username', 'file_url', 'thumbnail_url'
        ]
    
    
    def create(self, validated_data):
        # Auto-generate slug from title if not provided
        if 'slug' not in validated_data:
            title = validated_data.get('title', 'untitled')
            validated_data['slug'] = slugify(title)
            # Handle duplicate slugs
            base_slug = validated_data['slug']
            counter = 1
            while MediaFile.objects.filter(slug=validated_data['slug']).exists():
                validated_data['slug'] = f"{base_slug}-{counter}"
                counter += 1

        validated_data['user'] = self.context['request'].user
        # ... rest of your create logic ...
        return super().create(validated_data)

    
    def get_file_size_mb(self, obj):
        return obj.get_file_size_mb()

    def get_duration_formatted(self, obj):
        return obj.get_duration_formatted()
    
    def get_file(self, obj):
        if obj.file:
            file_path = str(obj.file)
            return f'/api/serve_media_file/{file_path}'
        return None
    
    def get_thumbnail(self, obj):
        if obj.thumbnail:
            thumb_path = str(obj.thumbnail)
            return f'/api/serve_media_file/{thumb_path}'
        return None

    def get_file_url(self, obj):
        return generate_presigned_object_url(obj.file)

    def get_thumbnail_url(self, obj):
        return generate_presigned_object_url(obj.thumbnail)

    
    
    """def get_file_url(self, obj):
        if obj.file:
           request = self.context.get('request')
           if request:
              file_path = str(obj.file)
              # ✅ FORCE HTTPS explicitly
              # Instead of relying on request.build_absolute_uri(), construct the URL manually
              # This bypasses Django's scheme detection entirely
              domain = request.get_host() # Gets "prime-cordi-fed-devo-7c4aa839.koyeb.app"
              return f"https://{domain}/api/serve_media_file/{file_path}"
        return None

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
           request = self.context.get('request')
           if request:
              thumb_path = str(obj.thumbnail)
              domain = request.get_host()
              return f"https://{domain}/api/serve_media_file/{thumb_path}"
        return None
    


   """