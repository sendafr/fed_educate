from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Question
from .serializers import QuestionSerializer

# ─── Question CRUD ────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def question_list_create(request):
    if request.method == 'GET':
        questions = Question.objects.all()
        serializer = QuestionSerializer(questions, many=True)
        return Response({
            'message': 'Questions retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = QuestionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Question created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def question_detail(request, pk):
    try:
        question = Question.objects.get(pk=pk)
    except Question.DoesNotExist:
        return Response(
            {'error': 'Question not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = QuestionSerializer(question)
        return Response({
            'message': 'Question retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = QuestionSerializer(
            question, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Question updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        question.delete()
        return Response(
            {'message': 'Question deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
        
@api_view(['GET'])
@permission_classes([AllowAny])
def question_by_quiz(request, quiz_id):
    """Get all questions for a specific quiz"""
    try:
        questions = Question.objects.filter(quiz_id=quiz_id)
        if not questions.exists():
            return Response(
                {'error': 'No questions found for this quiz.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = QuestionSerializer(questions, many=True)
        return Response({
            'message': 'Questions retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )