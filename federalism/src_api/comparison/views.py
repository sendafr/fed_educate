from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Comparison
from .serializers import ComparisonSerializer

# ─── Comparison CRUD ──────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def comparison_list_create(request):
    if request.method == 'GET':
        # Optional filtering by system type
        system_type = request.query_params.get('system_type')

        comparisons = Comparison.objects.all()

        if system_type:
            comparisons = comparisons.filter(system_type=system_type)

        serializer = ComparisonSerializer(comparisons, many=True)
        return Response({
            'message': 'Comparisons retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = ComparisonSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Comparison created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def comparison_detail(request, pk):
    try:
        comparison = Comparison.objects.get(pk=pk)
    except Comparison.DoesNotExist:
        return Response(
            {'error': 'Comparison not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = ComparisonSerializer(comparison)
        return Response({
            'message': 'Comparison retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = ComparisonSerializer(
            comparison, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Comparison updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        comparison.delete()
        return Response(
            {'message': 'Comparison deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get comparisons by system type (optional) ─────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def comparison_by_type(request, system_type):
    """Get all comparisons for a specific governance system type"""
    try:
        comparisons = Comparison.objects.filter(system_type=system_type)
        if not comparisons.exists():
            return Response({
                'message': 'No comparisons found for this system type.',
                'data': []
            }, status=status.HTTP_200_OK)
        
        serializer = ComparisonSerializer(comparisons, many=True)
        return Response({
            'message': 'Comparisons retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )