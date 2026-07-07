from rest_framework import serializers
from .models import Drawbacks

class DrawbacksSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drawbacks
        fields = [
            'id', 'title', 'description', 'category', 'severity', 'icon',
            'order', 'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_title(self, value):
        """Validate title is not empty"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_category(self, value):
        """Validate category is one of the allowed choices"""
        valid_categories = ['political', 'economic', 'social', 'administrative']
        if value not in valid_categories:
            raise serializers.ValidationError(
                f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        return value

    def validate_severity(self, value):
        """Validate severity is one of the allowed choices"""
        valid_severities = ['low', 'medium', 'high']
        if value not in valid_severities:
            raise serializers.ValidationError(
                f"Invalid severity. Must be one of: {', '.join(valid_severities)}"
            )
        return value