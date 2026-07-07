from rest_framework import serializers
from .models import CaseStudy
import json

class CaseStudySerializer(serializers.ModelSerializer):
    key_points = serializers.JSONField(required=False, allow_null=True)
    image = serializers.SerializerMethodField()  # ✅ Add this
    
    class Meta:
        model = CaseStudy
        fields = [
            'id', 'title', 'country', 'description', 'key_points', 
            'image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_image(self, obj):
        """Return full image URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def to_internal_value(self, data):
        if 'key_points' in data:
            key_points = data.get('key_points')
            if isinstance(key_points, str):
                try:
                    data['key_points'] = json.loads(key_points)
                except (json.JSONDecodeError, TypeError):
                    data['key_points'] = []
            elif key_points is None:
                data['key_points'] = []
        
        return super().to_internal_value(data)

    def validate_title(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_country(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Country cannot be empty.")
        return value

    def validate_key_points(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Key points must be a list.")
        return value