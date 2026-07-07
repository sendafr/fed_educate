from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Content
from .serializers import ContentSerializer

# ─── Content CRUD ──────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def content_list_create(request):
    if request.method == 'GET':
        # Optional filtering by section
        section_id = request.query_params.get('section_id')
        content_type = request.query_params.get('content_type')
        is_published = request.query_params.get('is_published')

        contents = Content.objects.all()

        if section_id:
            contents = contents.filter(section_id=section_id)
        if content_type:
            contents = contents.filter(content_type=content_type)
        if is_published:
            contents = contents.filter(is_published=is_published.lower() == 'true')

        serializer = ContentSerializer(contents, many=True)
        return Response({
            'message': 'Contents retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = ContentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Content created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def content_detail(request, pk):
    try:
        content = Content.objects.get(pk=pk)
    except Content.DoesNotExist:
        return Response(
            {'error': 'Content not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = ContentSerializer(content)
        return Response({
            'message': 'Content retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = ContentSerializer(
            content, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Content updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        content.delete()
        return Response(
            {'message': 'Content deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get content by section (optional) ─────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def content_by_section(request, section_id):
    """Get all content for a specific section"""
    try:
        contents = Content.objects.filter(section_id=section_id, is_published=True)
        if not contents.exists():
            return Response({
                'message': 'No content found for this section.',
                'data': []
            }, status=status.HTTP_200_OK)
        
        serializer = ContentSerializer(contents, many=True)
        return Response({
            'message': 'Content retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )