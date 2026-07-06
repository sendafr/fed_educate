from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.text import slugify
from .models import Section
from .serializers import SectionSerializer

# ─── Section CRUD ─────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def section_list_create(request):
    if request.method == 'GET':
        # Optional filtering
        section_type = request.query_params.get('section_type')
        is_published = request.query_params.get('is_published')

        sections = Section.objects.all()

        if section_type:
            sections = sections.filter(section_type=section_type)
        if is_published:
            sections = sections.filter(is_published=is_published.lower() == 'true')

        serializer = SectionSerializer(sections, many=True)
        return Response({
            'message': 'Sections retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = SectionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Section created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def section_detail(request, pk):
    try:
        section = Section.objects.get(pk=pk)
    except Section.DoesNotExist:
        return Response(
            {'error': 'Section not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = SectionSerializer(section)
        return Response({
            'message': 'Section retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = SectionSerializer(
            section, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Section updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        section.delete()
        return Response(
            {'message': 'Section deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get section by type (optional) ────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def section_by_type(request, section_type):
    """Get all sections of a specific type"""
    try:
        sections = Section.objects.filter(section_type=section_type, is_published=True)
        if not sections.exists():
            return Response({
                'message': 'No sections found for this type.',
                'data': []
            }, status=status.HTTP_200_OK)
        
        serializer = SectionSerializer(sections, many=True)
        return Response({
            'message': 'Sections retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─── Get section by slug (optional) ────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def section_by_slug(request, slug):
    """Get a section by its slug"""
    try:
        section = Section.objects.get(slug=slug)
        serializer = SectionSerializer(section)
        return Response({
            'message': 'Section retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Section.DoesNotExist:
        return Response(
            {'error': 'Section not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )