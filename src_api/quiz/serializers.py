from rest_framework import serializers
from .models import Quiz



"""
class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'section', 'difficulty', 'questions']"""
        


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'section', 'difficulty', 'is_published', 'created_at'
        ]
        read_only_fields = ['created_at']

    def validate_difficulty(self, value):
        """Validate difficulty is one of the allowed choices"""
        valid_difficulties = ['easy', 'medium', 'hard']
        if value not in valid_difficulties:
            raise serializers.ValidationError(
                f"Invalid difficulty level. Must be one of: {', '.join(valid_difficulties)}"
            )
        return value