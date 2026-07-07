from rest_framework import serializers
from .models import Comparison

class ComparisonSerializer(serializers.ModelSerializer):
    system_type_display = serializers.CharField(source='get_system_type_display', read_only=True)
    
    class Meta:
        model = Comparison
        fields = [
            'id', 'system_type', 'system_type_display', 'title', 'description', 
            'advantages', 'disadvantages', 'examples'
        ]
        read_only_fields = ['system_type_display']

    def validate_title(self, value):
        """Validate title is not empty"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_system_type(self, value):
        """Validate system type is one of the allowed choices"""
        valid_types = ['unitary', 'confederal', 'centralized']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid system type. Must be one of: {', '.join(valid_types)}"
            )
        return value

    def validate_advantages(self, value):
        """Validate advantages is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Advantages must be a list.")
        return value

    def validate_disadvantages(self, value):
        """Validate disadvantages is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Disadvantages must be a list.")
        return value

    def validate_examples(self, value):
        """Validate examples is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Examples must be a list.")
        return value