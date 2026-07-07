from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Benefits
from .serializers import BenefitsSerializer

# ─── Benefit CRUD ──────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def benefit_list_create(request):
    if request.method == 'GET':
        # Optional filtering
        category = request.query_params.get('category')
        is_published = request.query_params.get('is_published')

        benefits = Benefits.objects.all()

        if category:
            benefits = benefits.filter(category=category)
        if is_published:
            benefits = benefits.filter(is_published=is_published.lower() == 'true')

        serializer = BenefitsSerializer(benefits, many=True)
        return Response({
            'message': 'Benefits retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = BenefitsSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Benefit created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def benefit_detail(request, pk):
    try:
        benefit = Benefits.objects.get(pk=pk)
    except Benefits.DoesNotExist:
        return Response(
            {'error': 'Benefit not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = BenefitsSerializer(benefit)
        return Response({
            'message': 'Benefit retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = BenefitsSerializer(
            benefit, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Benefit updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        benefit.delete()
        return Response(
            {'message': 'Benefit deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get benefits by category ──────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def benefit_by_category(request, category):
    """Get all benefits for a specific category"""
    try:
        benefit = Benefits.objects.filter(category=category, is_published=True)
        if not benefit.exists():
            return Response({
                'message': f'No benefits found for category: {category}.',
                'data': []
            }, status=status.HTTP_200_OK)
        
        serializer = BenefitsSerializer(benefit, many=True)
        return Response({
            'message': 'Benefits retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )