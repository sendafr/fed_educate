from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UserQuizResponse
from .serializers import UserQuizResponseSerializer
from quiz.models import Quiz
from question.models import Question

# ─── User Quiz Response CRUD ──────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_quiz_response_list_create(request):
    if request.method == 'GET':
        # Get responses for current user
        quiz_id = request.query_params.get('quiz_id')
        is_correct = request.query_params.get('is_correct')

        responses = UserQuizResponse.objects.filter(user=request.user)

        if quiz_id:
            responses = responses.filter(quiz_id=quiz_id)
        if is_correct:
            responses = responses.filter(is_correct=is_correct.lower() == 'true')

        serializer = UserQuizResponseSerializer(responses, many=True)
        return Response({
            'message': 'Quiz responses retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = UserQuizResponseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Quiz response recorded successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_quiz_response_detail(request, pk):
    try:
        response_obj = UserQuizResponse.objects.get(pk=pk)
    except UserQuizResponse.DoesNotExist:
        return Response(
            {'error': 'Quiz response not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user owns this response
    if response_obj.user != request.user:
        return Response(
            {'error': 'You do not have permission to access this response.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        serializer = UserQuizResponseSerializer(response_obj)
        return Response({
            'message': 'Quiz response retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = UserQuizResponseSerializer(
            response_obj,
            data=request.data,
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Quiz response updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        response_obj.delete()
        return Response(
            {'message': 'Quiz response deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get quiz statistics for current user ──────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quiz_statistics(request, quiz_id):
    """Get quiz statistics for current user"""
    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return Response(
            {'error': 'Quiz not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        responses = UserQuizResponse.objects.filter(user=request.user, quiz=quiz)
        
        total_questions = responses.count()
        correct_answers = responses.filter(is_correct=True).count()
        incorrect_answers = responses.filter(is_correct=False).count()
        
        score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0

        return Response({
            'message': 'Quiz statistics retrieved successfully.',
            'data': {
                'quiz_id': quiz.id,
                'quiz_title': quiz.title,
                'total_questions': total_questions,
                'correct_answers': correct_answers,
                'incorrect_answers': incorrect_answers,
                'score_percentage': round(score_percentage, 2),
                'passing_score': quiz.passing_score if hasattr(quiz, 'passing_score') else 70,
                'passed': score_percentage >= (quiz.passing_score if hasattr(quiz, 'passing_score') else 70)
            }
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─── Get all user quiz attempts ────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_quiz_attempts(request):
    """Get all quiz attempts for current user"""
    try:
        # Get unique quizzes attempted by user
        responses = UserQuizResponse.objects.filter(user=request.user)
        
        # Group by quiz and get stats
        quiz_stats = {}
        for response in responses:
            quiz_id = response.quiz.id
            if quiz_id not in quiz_stats:
                quiz_stats[quiz_id] = {
                    'quiz_id': response.quiz.id,
                    'quiz_title': response.quiz.title,
                    'total_responses': 0,
                    'correct': 0,
                    'incorrect': 0,
                    'last_attempted': response.timestamp
                }
            
            quiz_stats[quiz_id] ['total_responses'] += 1
            if response.is_correct:
                quiz_stats[quiz_id] ['correct'] += 1
            else:
                quiz_stats[quiz_id] ['incorrect'] += 1
            
            # Update last attempted time
            if response.timestamp > quiz_stats[quiz_id] ['last_attempted']:
                quiz_stats[quiz_id] ['last_attempted'] = response.timestamp

        return Response({
            'message': 'Quiz attempts retrieved successfully.',
            'data': list(quiz_stats.values())
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─── Get responses by quiz ─────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def responses_by_quiz(request, quiz_id):
    """Get all responses for a specific quiz by current user"""
    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return Response(
            {'error': 'Quiz not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        responses = UserQuizResponse.objects.filter(user=request.user, quiz=quiz)
        serializer = UserQuizResponseSerializer(responses, many=True)
        return Response({
            'message': 'Quiz responses retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )