from django.shortcuts import render
import logging

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.text import slugify
from .models import MediaUpload, MediaFile, MediaCategory, MediaTag, MediaDownload
from .serializers import (
    MediaUploadSerializer,
    MediaFileSerializer,
    MediaFileCreateUpdateSerializer,
    MediaCategorySerializer,
    MediaTagSerializer,
    MediaDownloadSerializer
)

logger = logging.getLogger(__name__)
import boto3
from botocore.client import Config
from django.views.decorators.http import require_GET
#Create a Public Media View in Django
from .tasks import process_media_task  # Adjust path if your tasks.py is in a different app
        
from django.http import FileResponse, HttpResponse
from django.views.decorators.http import condition
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework import status
from celery.result import AsyncResult
from django.conf import settings
import os
import mimetypes
import re

MEDIA_TYPE_ALIASES = {
    'videos': 'video',
    'video': 'video',
    'images': 'image',
    'image': 'image',
    'docs': 'document',
    'doc': 'document',
    'document': 'document',
    'documentary': 'documentary',
    'maps': 'map',
    'map': 'map',
    'studycases': 'studycase',
    'studycase': 'studycase',
    'study_case': 'studycase',
}


def normalize_media_type(value):
    if not value:
        return value
    return MEDIA_TYPE_ALIASES.get(value.strip().lower(), value.strip().lower())


import os, mimetypes, re
from django.http import FileResponse, HttpResponse, Http404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt


from django.http import Http404, HttpResponseRedirect
from django.conf import settings
import boto3
from botocore.client import Config

@csrf_exempt
def serve_media_file(request, file_path):
    file_path = file_path.lstrip('/')
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    # ADD THESE 3 LINES - replace your startswith check with this
    media_root_abs = os.path.abspath(settings.MEDIA_ROOT)
    full_path_abs = os.path.abspath(full_path)
    
    if os.path.commonpath([full_path_abs, media_root_abs]) != media_root_abs:
        return HttpResponse('Access Denied', status=403)
    
    if not os.path.exists(full_path):
        raise Http404("File not found")
    
    mime_type, _ = mimetypes.guess_type(full_path)
    mime_type = mime_type or 'application/octet-stream'
    file_size = os.path.getsize(full_path)
    
    range_header = request.META.get('HTTP_RANGE', '').strip()
    if range_header:
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            length = end - start + 1
            
            response = FileResponse(open(full_path, 'rb'), content_type=mime_type)
            response.status_code = 206
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(length)
            response['Accept-Ranges'] = 'bytes'
            return response
    
    response = FileResponse(open(full_path, 'rb'), content_type=mime_type)
    response['Accept-Ranges'] = 'bytes'
    response['Content-Length'] = str(file_size)
    return response

#This serve_media_file view 

"""@csrf_exempt
def serve_media_file(request, file_path):
    file_path = file_path.lstrip('/')
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    if os.path.commonpath([os.path.abspath(full_path), os.path.abspath(settings.MEDIA_ROOT)]) != os.path.abspath(settings.MEDIA_ROOT):
        return HttpResponse('Access Denied', status=403)
    
    if not os.path.exists(full_path):
        raise Http404("File not found")
    
    mime_type, _ = mimetypes.guess_type(full_path)
    mime_type = mime_type or 'application/octet-stream'
    file_size = os.path.getsize(full_path)
    
    range_header = request.META.get('HTTP_RANGE', '').strip()
    if range_header:
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            if start >= file_size or end >= file_size:
                return HttpResponse(status=416, headers={'Content-Range': f'bytes */{file_size}'})
            
            length = end - start + 1
            response = FileResponse(open(full_path, 'rb'), content_type=mime_type)
            response.status_code = 206
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(length)
            response['Accept-Ranges'] = 'bytes'
            return response
    
    response = FileResponse(open(full_path, 'rb'), content_type=mime_type)
    response['Accept-Ranges'] = 'bytes'
    response['Content-Length'] = str(file_size)
    response['Cache-Control'] = 'public, max-age=86400'
    return response
"""

"""@csrf_exempt  # Allow unauthenticated access
def serve_media_file(request, file_path):
    
    #Serve media files publicly without authentication.
    #Supports range requests for video seeking.
    
    # Security: Prevent directory traversal attacks
    file_path = file_path.lstrip('/')
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    # Ensure the file is within MEDIA_ROOT
    if not os.path.abspath(full_path).startswith(os.path.abspath(settings.MEDIA_ROOT)):
        return HttpResponse('Access Denied', status=403)
    
    # Check if file exists
    if not os.path.exists(full_path):
        return HttpResponse('File Not Found', status=404)
    
    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(full_path)
    if not mime_type:
        mime_type = 'application/octet-stream'
    
    file_size = os.path.getsize(full_path)
    
    # Handle Range requests (for video seeking)
    range_header = request.META.get('HTTP_RANGE', '')
    
    if range_header:
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            # Validate range
            if start >= file_size or end >= file_size:
                return HttpResponse('Range Not Satisfiable', status=416)
            
            with open(full_path, 'rb') as f:
                f.seek(start)
                response = HttpResponse(f.read(end - start + 1), content_type=mime_type, status=206)
            
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(end - start + 1)
        else:
            response = FileResponse(open(full_path, 'rb'), content_type=mime_type)
            response['Content-Length'] = str(file_size)
    else:
        response = FileResponse(open(full_path, 'rb'), content_type=mime_type)
        response['Content-Length'] = str(file_size)
    
    # Add required headers for video streaming
    response['Accept-Ranges'] = 'bytes'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Range'
    response['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges'
    response['Cache-Control'] = 'public, max-age=86400'
    
    return response

 

# ───"" MediaUpload CRUD ──────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def media_upload_list_create(request):
    if request.method == 'GET':
        media_uploads = MediaUpload.objects.all()
        serializer = MediaUploadSerializer(media_uploads, many=True, context={'request': request})
        return Response({
            'message': 'Media uploads retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Check authentication
        if not request.user or request.user.is_anonymous:
            return Response(
                {'error': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Validate data
        serializer = MediaUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # 1. Save the instance first (sets status to 'pending' by default in model)
            media_instance = serializer.save(user=request.user)
            
            # 2. Trigger the background Celery task
            # Pass the ID of the saved instance
            process_media_task.delay(media_instance.id)

            return Response({
                'message': 'Media uploaded successfully. Processing started in the background.',
                'data': {
                    **serializer.data,
                    'status': 'pending', # Explicitly return the current status
                    'task_id':task_id.id # <--SEND THIS TO FRONTEND
                    
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def media_progress(request, task_id):
    task = AsyncResult(task_id)
    
    # Handle case where task ID is invalid
    if task.state == 'PENDING' and task.info is None:
        # Check if task exists in backend (sometimes PENDING means 'not found')
        # If you are sure the task was sent, it might just be waiting in queue
        return Response({'percent': 0, 'status': 'Queued (Waiting for worker)'})

    if task.state == 'PENDING':
        return Response({'percent': 0, 'status': 'Queued'})
    
    elif task.state == 'PROGRESS':
        # Safely get info, fallback to defaults if None
        info = task.info or {}
        return Response({
            'percent': info.get('percent', 0),
            'status': info.get('status', 'Processing...')
        })
    
    elif task.state == 'SUCCESS':
        info = task.info or {}
        return Response({
            'percent': 100, 
            'status': 'Completed',
            'media_id': info.get('media_id')
        })
    
    elif task.state == 'FAILURE':
        info = task.info or {}
        error_msg = info.get('status', str(task.info)) if info else 'Unknown error'
        return Response({
            'percent': 0, 
            'status': f'Failed: {error_msg}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    else:
        # Handle other states like REVOKED
        return Response({
            'percent': 0, 
            'status': f'Task state: {task.state}'
        }, status=status.HTTP_400_BAD_REQUEST)


"""@api_view(['GET'])
@permission_classes([AllowAny])
def media_progress(request, task_id):
    result = AsyncResult(task_id)
    
    if result.state == 'PROGRESS':
        return Response(result.info) # {percent, status, current, total}
    elif result.state == 'SUCCESS':
        return Response(result.result)
    elif result.state == 'FAILURE':
        return Response({'percent': 0, 'status': 'Failed', 'error': str(result.info)}, status=500)
    
    return Response({'percent': 0, 'status': result.state})

"""




"""
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def media_upload_list_create(request):
    if request.method == 'GET':
        media_uploads = MediaUpload.objects.all()
        serializer = MediaUploadSerializer(media_uploads, many=True, context={'request': request})
        return Response({
            'message': 'Media uploads retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if not request.user or request.user.is_anonymous:
            return Response(
                {'error': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        serializer = MediaUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Media uploaded successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
"""

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def media_upload_detail(request, pk):
    try:
        media_upload = MediaUpload.objects.get(pk=pk)
    except MediaUpload.DoesNotExist:
        return Response(
            {'error': 'Media upload not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = MediaUploadSerializer(media_upload, context={'request': request})
        return Response({
            'message': 'Media upload retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    # ... (PUT, PATCH, DELETE logic remains exactly the same) ...
    elif request.method in ['PUT', 'PATCH']:
        if media_upload.user != request.user:
            return Response(
                {'error': 'You do not have permission to edit this media.'},
                status=status.HTTP_403_FORBIDDEN
            )
        partial = request.method == 'PATCH'
        serializer = MediaUploadSerializer(
            media_upload,
            data=request.data,
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Media upload updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if media_upload.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete this media.'},
                status=status.HTTP_403_FORBIDDEN
            )
        media_upload.delete()
        return Response(
            {'message': 'Media upload deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )



"""
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def media_upload_detail(request, pk):
    try:
        media_upload = MediaUpload.objects.get(pk=pk)
    except MediaUpload.DoesNotExist:
        return Response(
            {'error': 'Media upload not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = MediaUploadSerializer(media_upload, context={'request': request})
        return Response({
            'message': 'Media upload retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        if media_upload.user != request.user:
            return Response(
                {'error': 'You do not have permission to edit this media.'},
                status=status.HTTP_403_FORBIDDEN
            )
        partial = request.method == 'PATCH'
        serializer = MediaUploadSerializer(
            media_upload,
            data=request.data,
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Media upload updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if media_upload.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete this media.'},
                status=status.HTTP_403_FORBIDDEN
            )
        media_upload.delete()
        return Response(
            {'message': 'Media upload deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )"""


# ─── Signed URL for media upload (for private S3 buckets) ─────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def media_upload_signed_url(request, pk):
    try:
        media_upload = MediaUpload.objects.get(pk=pk)
    except MediaUpload.DoesNotExist:
        return Response({'error': 'Media upload not found.'}, status=status.HTTP_404_NOT_FOUND)

    object_key = media_upload.file.name
    if not object_key:
        return Response({'error': 'No file associated with this upload.'}, status=status.HTTP_400_BAD_REQUEST)

    aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
    aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
    aws_region = getattr(settings, 'AWS_S3_REGION_NAME', getattr(settings, 'AWS_S3_REGION', None)) or 'eu-west-1'
    endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)

    if not all([aws_access_key, aws_secret_key, bucket, endpoint_url, aws_region]):
        return Response({'error': 'S3 configuration missing on server.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region,
            endpoint_url=endpoint_url,
            config=Config(signature_version='s3v4', region_name=aws_region)
        )

        presigned = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': object_key},
            ExpiresIn=300
        )

        return Response({'signed_url': presigned}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f'Failed to generate signed URL: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Debug signed URL / object key info for media upload -----------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def debug_media_upload_signed_url(request, pk):
    try:
        media_upload = MediaUpload.objects.get(pk=pk)
    except MediaUpload.DoesNotExist:
        return Response({'error': 'Media upload not found.'}, status=status.HTTP_404_NOT_FOUND)

    object_key = media_upload.file.name
    if not object_key:
        return Response({'error': 'No file associated with this upload.'}, status=status.HTTP_400_BAD_REQUEST)

    aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
    aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
    aws_region = getattr(settings, 'AWS_S3_REGION_NAME', getattr(settings, 'AWS_S3_REGION', None)) or 'eu-west-1'
    endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)

    debug_info = {
        'object_key': object_key,
        'bucket': bucket,
        'endpoint_url': endpoint_url,
        'aws_region': aws_region,
    }

    if not all([aws_access_key, aws_secret_key, bucket, endpoint_url, aws_region]):
        debug_info['error'] = 'S3 configuration missing on server.'
        return Response(debug_info, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region,
            endpoint_url=endpoint_url,
            config=Config(signature_version='s3v4', region_name=aws_region)
        )

        presigned = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': object_key},
            ExpiresIn=300
        )
        debug_info['signed_url'] = presigned

        try:
            s3.head_object(Bucket=bucket, Key=object_key)
            debug_info['head_object'] = 'found'
        except Exception as head_err:
            debug_info['head_object_error'] = str(head_err)

        return Response(debug_info, status=status.HTTP_200_OK)
    except Exception as e:
        debug_info['error'] = str(e)
        return Response(debug_info, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── MediaFile CRUD ───────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def media_file_list_create(request):
    if request.method == 'GET':
        media_type = request.query_params.get('media_type')
        status_filter = request.query_params.get('status')
        is_featured = request.query_params.get('is_featured')

        media_files = MediaFile.objects.all()

        if media_type:
            normalized_media_type = normalize_media_type(media_type)
            media_files = media_files.filter(media_type=normalized_media_type)
        if status_filter:
            media_files = media_files.filter(status=status_filter)
        if is_featured:
            media_files = media_files.filter(is_featured=is_featured.lower() == 'true')

        serializer = MediaFileSerializer(media_files, many=True, context={'request': request})
        return Response({
            'message': 'Media files retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if not request.user or request.user.is_anonymous:
            return Response(
                {'error': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        try:
            serializer = MediaFileCreateUpdateSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                media_file = serializer.save()
                # Generate slug if not provided
                if not media_file.slug:
                    media_file.slug = slugify(media_file.title)
                    media_file.save()
                return Response({
                    'message': 'Media file created successfully.',
                    'data': MediaFileSerializer(media_file, context={'request': request}).data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception('Media file creation failed')
            return Response(
                {
                    'error': 'Internal server error while creating media file.',
                    'detail': str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def media_file_detail(request, pk):
    try:
        media_file = MediaFile.objects.get(pk=pk)
    except MediaFile.DoesNotExist:
        return Response(
            {'error': 'Media file not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = MediaFileSerializer(media_file, context={'request': request})
        return Response({
            'message': 'Media file retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        if media_file.user != request.user:
            return Response(
                {'error': 'You do not have permission to edit this media.'},
                status=status.HTTP_403_FORBIDDEN
            )
        partial = request.method == 'PATCH'
        serializer = MediaFileCreateUpdateSerializer(
            media_file,
            data=request.data,
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            media_file = serializer.save()
            return Response({
                'message': 'Media file updated successfully.',
                'data': MediaFileSerializer(media_file, context={'request': request}).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if media_file.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete this media.'},
                status=status.HTTP_403_FORBIDDEN
            )
        media_file.delete()
        return Response(
            {'message': 'Media file deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Signed URL for media file (for private S3 buckets) ──────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def media_file_signed_url(request, pk):
    try:
        media_file = MediaFile.objects.get(pk=pk)
    except MediaFile.DoesNotExist:
        return Response({'error': 'Media file not found.'}, status=status.HTTP_404_NOT_FOUND)

    object_key = media_file.file.name
    if not object_key:
        return Response({'error': 'No file associated with this media.'}, status=status.HTTP_400_BAD_REQUEST)

    aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
    aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
    aws_region = getattr(settings, 'AWS_S3_REGION_NAME', getattr(settings, 'AWS_S3_REGION', None)) or 'eu-west-1'
    endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)

    if not all([aws_access_key, aws_secret_key, bucket, endpoint_url, aws_region]):
        return Response({'error': 'S3 configuration missing on server.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region,
            endpoint_url=endpoint_url,
            config=Config(signature_version='s3v4', region_name=aws_region)
        )

        presigned = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': object_key},
            ExpiresIn=300
        )

        return Response({'signed_url': presigned}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f'Failed to generate signed URL: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Debug signed URL / object key info for media file -------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def debug_media_file_signed_url(request, pk):
    try:
        media_file = MediaFile.objects.get(pk=pk)
    except MediaFile.DoesNotExist:
        return Response({'error': 'Media file not found.'}, status=status.HTTP_404_NOT_FOUND)

    object_key = media_file.file.name
    if not object_key:
        return Response({'error': 'No file associated with this media.'}, status=status.HTTP_400_BAD_REQUEST)

    aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
    aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
    aws_region = getattr(settings, 'AWS_S3_REGION_NAME', getattr(settings, 'AWS_S3_REGION', None)) or 'eu-west-1'
    endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)

    debug_info = {
        'object_key': object_key,
        'bucket': bucket,
        'endpoint_url': endpoint_url,
        'aws_region': aws_region,
    }

    if not all([aws_access_key, aws_secret_key, bucket, endpoint_url, aws_region]):
        debug_info['error'] = 'S3 configuration missing on server.'
        return Response(debug_info, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region,
            endpoint_url=endpoint_url,
            config=Config(signature_version='s3v4', region_name=aws_region)
        )

        presigned = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': object_key},
            ExpiresIn=300
        )
        debug_info['signed_url'] = presigned

        try:
            s3.head_object(Bucket=bucket, Key=object_key)
            debug_info['head_object'] = 'found'
        except Exception as head_err:
            debug_info['head_object_error'] = str(head_err)

        return Response(debug_info, status=status.HTTP_200_OK)
    except Exception as e:
        debug_info['error'] = str(e)
        return Response(debug_info, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── MediaCategory CRUD ───────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def media_category_list_create(request):
    if request.method == 'GET':
        categories = MediaCategory.objects.all()
        serializer = MediaCategorySerializer(categories, many=True)
        return Response({
            'message': 'Categories retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        permission_classes = [IsAuthenticated]
        serializer = MediaCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Category created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def media_category_detail(request, pk):
    try:
        category = MediaCategory.objects.get(pk=pk)
    except MediaCategory.DoesNotExist:
        return Response(
            {'error': 'Category not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = MediaCategorySerializer(category)
        return Response({
            'message': 'Category retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = MediaCategorySerializer(category, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Category updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        category.delete()
        return Response(
            {'message': 'Category deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── MediaTag CRUD ────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def media_tag_list_create(request):
    if request.method == 'GET':
        tags = MediaTag.objects.all()
        serializer = MediaTagSerializer(tags, many=True)
        return Response({
            'message': 'Tags retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        permission_classes = [IsAuthenticated]
        serializer = MediaTagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Tag created successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def media_tag_detail(request, pk):
    try:
        tag = MediaTag.objects.get(pk=pk)
    except MediaTag.DoesNotExist:
        return Response(
            {'error': 'Tag not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = MediaTagSerializer(tag)
        return Response({
            'message': 'Tag retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = MediaTagSerializer(tag, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Tag updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        tag.delete()
        return Response(
            {'message': 'Tag deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ─── MediaDownload CRUD ───────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def media_download_list_create(request):
    if request.method == 'GET':
        downloads = MediaDownload.objects.filter(user=request.user)
        serializer = MediaDownloadSerializer(downloads, many=True)
        return Response({
            'message': 'Downloads retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = MediaDownloadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Download recorded successfully.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def media_download_detail(request, pk):
    try:
        download = MediaDownload.objects.get(pk=pk)
    except MediaDownload.DoesNotExist:
        return Response(
            {'error': 'Download record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if download.user != request.user:
        return Response(
            {'error': 'You do not have permission to access this download.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        serializer = MediaDownloadSerializer(download)
        return Response({
            'message': 'Download retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        download.delete()
        return Response(
            {'message': 'Download record deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )