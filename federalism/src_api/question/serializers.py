from rest_framework import serializers
from .models import Question

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'quiz', 'question_text', 'question_type', 'options',
            'correct_answer', 'explanation', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_question_type(self, value):
        """Validate question type is one of the allowed choices"""
        valid_types = ['multiple_choice', 'fill_blank', 'true_false', 'short_answer']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid question type. Must be one of: {', '.join(valid_types)}"
            )
        return value

    def validate_options(self, value):
        """Validate options based on question type"""
        # Options should be a list for multiple choice questions
        if not isinstance(value, list):
            raise serializers.ValidationError("Options must be a list")
        return value

    def validate(self, data):
        """Validate question data"""
        question_type = data.get('question_type')
        options = data.get('options', [])

        # Multiple choice questions should have options
        if question_type == 'multiple_choice' and not options:
            raise serializers.ValidationError(
                "Multiple choice questions must have options"
            )

        return data