from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ExternalMedia, ExternalMediaDownload
from .serializers import (
    ExternalMediaSerializer,
    ExternalMediaCreateUpdateSerializer,
    ExternalMediaDownloadSerializer,
    normalize_media_type,
)


# ─── External Media CRUD ──────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def external_media_list_create(request):
    if request.method == 'POST' and not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if request.method == 'GET':
        source_type = request.query_params.get('source_type')
        media_type = request.query_params.get('media_type')
        status_filter = request.query_params.get('status')
        is_featured = request.query_params.get('is_featured')

        external_media = ExternalMedia.objects.all()
        if source_type:
            external_media = external_media.filter(source_type=source_type)
        if media_type:
            normalized_media_type = normalize_media_type(media_type)
            external_media = external_media.filter(media_type=normalized_media_type)
        if status_filter:
            external_media = external_media.filter(status=status_filter)
        if is_featured:
            external_media = external_media.filter(is_featured=is_featured.lower() == 'true')

        serializer = ExternalMediaSerializer(external_media, many=True, context={'request': request})
        return Response({
            'message': 'External media retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    serializer = ExternalMediaCreateUpdateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        media = serializer.save()
        return Response({
            'message': 'External media created successfully.',
            'data': ExternalMediaSerializer(media, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def external_media_detail(request, pk):
    try:
        media = ExternalMedia.objects.get(pk=pk)
    except ExternalMedia.DoesNotExist:
        return Response({'error': 'External media not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ExternalMediaSerializer(media, context={'request': request})
        return Response({'message': 'External media retrieved successfully.', 'data': serializer.data}, status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if media.user != request.user:
        return Response({'error': 'You do not have permission to edit this media.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = ExternalMediaCreateUpdateSerializer(media, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            media = serializer.save()
            return Response({'message': 'External media updated successfully.', 'data': ExternalMediaSerializer(media, context={'request': request}).data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    media.delete()
    return Response({'message': 'External media deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def external_media_download_list_create(request):
    if request.method == 'GET':
        downloads = ExternalMediaDownload.objects.all()
        serializer = ExternalMediaDownloadSerializer(downloads, many=True)
        return Response({'message': 'External downloads retrieved successfully.', 'data': serializer.data}, status=status.HTTP_200_OK)

    serializer = ExternalMediaDownloadSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        download = serializer.save()
        return Response({'message': 'External media download saved successfully.', 'data': ExternalMediaDownloadSerializer(download).data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def external_media_download_detail(request, pk):
    try:
        download = ExternalMediaDownload.objects.get(pk=pk)
    except ExternalMediaDownload.DoesNotExist:
        return Response({'error': 'Download not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ExternalMediaDownloadSerializer(download)
        return Response({'message': 'External download retrieved successfully.', 'data': serializer.data}, status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if request.method in ['PUT', 'PATCH']:
        serializer = ExternalMediaDownloadSerializer(download, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            download = serializer.save()
            return Response({'message': 'External download updated successfully.', 'data': ExternalMediaDownloadSerializer(download).data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    download.delete()
    return Response({'message': 'External download deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
