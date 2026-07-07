from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
import boto3
from botocore.client import Config
#from django.views.generic import TemplateView
#from django.urls import re_path

def health_check(request):
    return JsonResponse({"status": "healthy", "service": "backend"})


def storage_health_check(request):
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
    endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
    aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
    aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)

    if not all([bucket, endpoint_url, aws_access_key, aws_secret_key]):
        return JsonResponse(
            {"status": "unhealthy", "service": "storage", "error": "S3 configuration missing"},
            status=500
        )

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            endpoint_url=endpoint_url,
            config=Config(signature_version='s3v4')
        )
        s3.head_bucket(Bucket=bucket)
        return JsonResponse({"status": "healthy", "service": "storage", "bucket": bucket})
    except Exception as e:
        return JsonResponse(
            {"status": "unhealthy", "service": "storage", "bucket": bucket, "error": str(e)},
            status=500
        )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    
    # API Routes
    path('api/content/', include('content.urls')),
    path('api/section/', include('section.urls')),
    path('api/quiz/', include('quiz.urls')),
    path('api/question/', include('question.urls')),
    path('api/comparison/', include('comparison.urls')),
    path('api/caseStudy/', include('caseStudy.urls')), 
    path('api/benefits/', include('benefits.urls')),
    path('api/drawbacks/', include('drawbacks.urls')),
    path('api/users/', include('users.urls')),
    path('api/auth/users/', include('users.urls')),
    # Backwards-compatible alias: some frontends use /api/auth/ directly
    path('api/auth/', include('users.urls')),
    path('api/media_manager/', include('media_manager.urls')),
    path('api/media_external_manager/', include('media_external_manager.urls')),
    path('api/', include('media_external_manager.urls')),
    path('api/health/', health_check, name='api_health_check'),
    path('api/health/storage/', storage_health_check, name='api_health_storage_check'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# 3. Catch-all for frontend SPA routing (EXCLUDE /api/ and /admin/)
# This regex matches anything that does NOT start with 'api/' or 'admin/'
#urlpatterns += [
    #re_path(r'^(?!api/|admin/|health/).*$', TemplateView.as_view(template_name='index.html'))
#]