import socket
import ipaddress
from urllib.parse import urlparse

from rest_framework import serializers

from .models import ExternalMedia, ExternalMediaDownload

MEDIA_TYPE_ALIASES = {
    'videos': 'video',
    'video': 'video',
    'images': 'image',
    'image': 'image',
    'docs': 'document',
    'doc': 'document',
    'document': 'document',
    'documentary': 'documentary',
    'maps': 'map',
    'map': 'map',
    'studycases': 'studycase',
    'studycase': 'studycase',
    'study_case': 'studycase',
}


def normalize_media_type(value):
    if not value:
        return value
    return MEDIA_TYPE_ALIASES.get(value.strip().lower(), value.strip().lower())


def is_unsafe_network_address(address):
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False

    return any([
        ip.is_private,
        ip.is_loopback,
        ip.is_reserved,
        ip.is_link_local,
        ip.is_unspecified,
        ip.is_multicast,
    ])


def validate_secure_url(url):
    """
    Validates that a URL is properly formatted, uses http/https, and does not resolve
    to a local or private network address to help prevent SSRF.
    """
    if not url:
        raise serializers.ValidationError("URL cannot be empty.")

    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise serializers.ValidationError("Invalid URL format.")
        if parsed.scheme not in ['http', 'https']:
            raise serializers.ValidationError("URL must use http or https scheme.")
        if parsed.hostname is None:
            raise serializers.ValidationError("Invalid URL hostname.")
        hostname = parsed.hostname.lower()
        if hostname == 'localhost' or hostname.endswith('.localhost'):
            raise serializers.ValidationError("Localhost URLs are not allowed.")

        try:
            for result in socket.getaddrinfo(hostname, None):
                address = result[4][0]
                if is_unsafe_network_address(address):
                    raise serializers.ValidationError(
                        "URLs resolving to private or local network addresses are not allowed."
                    )
        except socket.gaierror:
            raise serializers.ValidationError("Unable to resolve the provided URL host.")

        return url
    except serializers.ValidationError:
        raise
    except Exception:
        raise serializers.ValidationError("Invalid URL format.")
    
class ExternalMediaSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    class Meta:
        model = ExternalMedia
        fields = [
            'id', 'user', 'user_username', 'source_type', 'media_type', 'external_id',
            'external_url', 'embed_url', 'title', 'description', 'thumbnail_url',
            'duration', 'duration_formatted', 'status', 'is_featured',
            'created_at', 'updated_at', 'published_at', 'views_count',
            'downloads_count'
        ]
        read_only_fields = [
            'user', 'created_at', 'updated_at', 'views_count',
            'downloads_count', 'user_username'
        ]

    def get_duration_formatted(self, obj):
        return obj.get_duration_formatted()
    
    def validate_external_url(self, value):
        # Apply the secure validation
        return validate_secure_url(value)
    
    # ... rest of the serializer ...


class ExternalMediaCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalMedia
        fields = [
            'source_type', 'media_type', 'external_id', 'external_url', 'embed_url',
            'title', 'description', 'thumbnail_url', 'duration',
            'status', 'is_featured'
        ]

    def validate_source_type(self, value):
        valid_types = [choice[0] for choice in ExternalMedia.SOURCE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid source type. Must be one of: {', '.join(valid_types)}"
            )
        return value

    def validate_media_type(self, value):
        normalized = normalize_media_type(value)
        valid_types = [choice[0] for choice in ExternalMedia.MEDIA_TYPE_CHOICES]
        if normalized not in valid_types:
            raise serializers.ValidationError(
                f"Invalid media type. Must be one of: {', '.join(valid_types)}"
            )
        return normalized

    def validate_external_url(self, value):
        return validate_secure_url(value)

    def validate_embed_url(self, value):
        if value:
            return validate_secure_url(value)
        return value

    def validate_thumbnail_url(self, value):
        if value:
            return validate_secure_url(value)
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        if not user or not user.is_authenticated:
            raise serializers.ValidationError('Authentication is required to create external media.')
        validated_data['user'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    


class ExternalMediaDownloadSerializer(serializers.ModelSerializer):
    media_title = serializers.CharField(source='media.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = ExternalMediaDownload
        fields = ['id', 'media', 'media_title', 'user', 'user_username', 'ip_address', 'downloaded_at']
        read_only_fields = ['user', 'downloaded_at', 'user_username']

    def create(self, validated_data):
        user = self.context['request'].user
        if user and user.is_authenticated:
            validated_data['user'] = user
        return super().create(validated_data)
