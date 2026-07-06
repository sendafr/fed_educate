from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Drawbacks
from .serializers import DrawbacksSerializer

# ─── Drawback CRUD ────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def drawback_list_create(request):
    if request.method == 'GET':
        # Optional filtering
        category = request.query_params.get('category')
        severity = request.query_params.get('severity')
        is_published = request.query_params.get('is_published')

        drawbacks = Drawbacks.objects.all()

        if category:
            drawbacks = drawbacks.filter(category=category)
        if severity:
            drawbacks = drawbacks.filter(severity=severity)
        if is_published:
            drawbacks = drawbacks.filter(is_published=is_published.lower() == 'true')

        serializer = DrawbacksSerializer(drawbacks, many=True)
        return Response({
            'message': 'Drawbacks retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = DrawbacksSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Drawback created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def drawback_detail(request, pk):
    try:
        drawback = Drawbacks.objects.get(pk=pk)
    except Drawbacks.DoesNotExist:
        return Response(
            {'error': 'Drawback not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = DrawbacksSerializer(drawback)
        return Response({
            'message': 'Drawback retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = DrawbacksSerializer(
            drawback, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Drawback updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        drawback.delete()
        return Response(
            {'message': 'Drawback deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get drawbacks by category ────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def drawback_by_category(request, category):
    """Get all drawbacks for a specific category"""
    try:
        drawbacks = Drawbacks.objects.filter(category=category, is_published=True)
        if not drawbacks.exists():
            return Response({
                'message': f'No drawbacks found for category: {category}.',
                'data': []
            }, status=status.HTTP_200_OK)
        
        serializer = DrawbacksSerializer(drawbacks, many=True)
        return Response({
            'message': 'Drawbacks retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─── Get drawbacks by severity ────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def drawback_by_severity(request, severity):
    """Get all drawbacks with a specific severity level"""
    try:
        drawbacks = Drawbacks.objects.filter(severity=severity, is_published=True)
        if not drawbacks.exists():
            return Response({
                'message': f'No drawbacks found with severity: {severity}.',
                'data': []
            }, status=status.HTTP_200_OK)
        
        serializer = DrawbacksSerializer(drawbacks, many=True)
        return Response({
            'message': 'Drawbacks retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )