from rest_framework import serializers
from .models import UserQuizResponse
from quiz.serializers import QuizSerializer
from question.serializers import QuestionSerializer

class UserQuizResponseSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    quiz_details = QuizSerializer(source='quiz', read_only=True)
    question_details = QuestionSerializer(source='question', read_only=True)
    
    class Meta:
        model = UserQuizResponse
        fields = [
            'id', 'user', 'user_username', 'quiz', 'quiz_title', 'quiz_details',
            'question', 'question_text', 'question_details', 'user_answer', 
            'is_correct', 'timestamp'
        ]
        read_only_fields = ['user', 'user_username', 'quiz_title', 'question_text', 'timestamp']

    def validate_user_answer(self, value):
        """Validate user answer is not empty"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("User answer cannot be empty.")
        return value

    def create(self, validated_data):
        """Set user from request context"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)