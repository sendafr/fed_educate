from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Quiz
from .serializers import QuizSerializer

# ─── Quiz CRUD ─────────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def quiz_list_create(request):
    if request.method == 'GET':
        quizzes = Quiz.objects.all()
        serializer = QuizSerializer(quizzes, many=True)
        return Response({
            'message': 'Quizzes retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = QuizSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Quiz created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def quiz_detail(request, pk):
    try:
        quiz = Quiz.objects.get(pk=pk)
    except Quiz.DoesNotExist:
        return Response(
            {'error': 'Quiz not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = QuizSerializer(quiz)
        return Response({
            'message': 'Quiz retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = QuizSerializer(
            quiz, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Quiz updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        quiz.delete()
        return Response(
            {'message': 'Quiz deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get quizzes by section (optional) ─────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def quiz_by_section(request, section_id):
    """Get all quizzes for a specific section"""
    try:
        quizzes = Quiz.objects.filter(section_id=section_id)
        if not quizzes.exists():
           return Response({'message': 'No quizzes found for this section.',
                        
                      'data': []  },status=status.HTTP_200_OK )
            
        serializer = QuizSerializer(quizzes, many=True)
        return Response({
            'message': 'Quizzes retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )