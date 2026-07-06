from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CaseStudy
from .serializers import CaseStudySerializer

# ─── Case Study CRUD ───────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def case_study_list_create(request):
    if request.method == 'GET':
        # Optional filtering by country
        country = request.query_params.get('country')

        case_studies = CaseStudy.objects.all()

        if country:
            case_studies = case_studies.filter(country__icontains=country)

        serializer = CaseStudySerializer(case_studies, many=True)
        return Response({
            'message': 'Case studies retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = CaseStudySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Case study created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def case_study_detail(request, pk):
    try:
        case_study = CaseStudy.objects.get(pk=pk)
    except CaseStudy.DoesNotExist:
        return Response(
            {'error': 'Case study not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = CaseStudySerializer(case_study)
        return Response({
            'message': 'Case study retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = CaseStudySerializer(
            case_study, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Case study updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        case_study.delete()
        return Response(
            {'message': 'Case study deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Get case studies by country (optional) ────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def case_study_by_country(request, country):
    """Get all case studies for a specific country"""
    try:
        case_studies = CaseStudy.objects.filter(country__icontains=country)
        if not case_studies.exists():
            return Response({
                'message': f'No case studies found for {country}.',
                'data': []
            }, status=status.HTTP_200_OK)
        
        serializer = CaseStudySerializer(case_studies, many=True)
        return Response({
            'message': 'Case studies retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as err:
        return Response(
            {'error': str(err)},
            status=status.HTTP_400_BAD_REQUEST
        )