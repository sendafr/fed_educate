from rest_framework import serializers
from .models import Section
from content.serializers import ContentSerializer

class SectionSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = [
            'id', 'title', 'slug', 'section_type', 'description', 
            'order', 'is_published', 'created_at', 'updated_at', 'contents'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']

    def validate_title(self, value):
        """Validate title is not empty"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_section_type(self, value):
        """Validate section type is one of the allowed choices"""
        valid_types = ['what_is', 'benefits', 'drawbacks', 'comparisons', 'case_studies', 'quiz']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid section type. Must be one of: {', '.join(valid_types)}"
            )
        return value

    def create(self, validated_data):
        """Generate slug from title"""
        from django.utils.text import slugify
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['title'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update slug if title changes"""
        from django.utils.text import slugify
        if 'title' in validated_data and not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['title'])
        return super().update(instance, validated_data)