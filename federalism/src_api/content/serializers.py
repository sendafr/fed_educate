from rest_framework import serializers
from .models import Content

class ContentSerializer(serializers.ModelSerializer):
    section_title = serializers.CharField(source='section.title', read_only=True)
    
    class Meta:
        model = Content
        fields = [
            'id', 'section', 'section_title', 'title', 'content_type', 
            'description', 'text_content', 'media_url', 'media_file', 
            'order', 'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'section_title']

    def validate_content_type(self, value):
        """Validate content type is one of the allowed choices"""
        valid_types = ['text', 'video', 'image', 'infographic', 'chart', 'map', 'documentary']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid content type. Must be one of: {', '.join(valid_types)}"
            )
        return value

    def validate_title(self, value):
        """Validate title is not empty"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate(self, data):
        """Validate that at least one content field is provided"""
        has_content = (
            data.get('text_content') or 
            data.get('media_url') or 
            data.get('media_file')
        )
        if not has_content:
            raise serializers.ValidationError(
                "At least one of text_content, media_url, or media_file must be provided."
            )
        return data