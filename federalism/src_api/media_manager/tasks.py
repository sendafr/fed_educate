import os, tempfile, subprocess
from celery import shared_task
import boto3
from django.conf import settings

@shared_task(bind=True, max_retries=3)
def process_media_task(self, media_id):
    media = None
    thumb_path = None
    try:
        media = MediaUpload.objects.get(id=media_id)
        media.status = 'processing'
        media.save()

        self.update_state(state='PROGRESS', meta={'percent': 10})

        # 1. The file is already on B2. We just stream it
        file_url = media.file_url # MUST be https://... from upload-final
        if not file_url:
            raise Exception("file_url is empty. Did you use upload-final endpoint?")
        
        # 2. Temp file for thumbnail only
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_thumb:
            thumb_path = tmp_thumb.name

        # 3. Generate thumbnail directly from https
        subprocess.run([
            'ffmpeg', '-ss', '00:00:02', '-i', file_url, 
            '-vframes', '1', '-y', thumb_path
        ], check=True, timeout=600)
        
        self.update_state(state='PROGRESS', meta={'percent': 70})

        # 4. Upload thumbnail to B2 directly
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.B2_KEY_ID,
            aws_secret_access_key=settings.B2_APP_KEY,
            endpoint_url=settings.B2_ENDPOINT
        )
        thumb_key = f"thumbnails/{media.id}.jpg"
        s3.upload_file(thumb_path, settings.B2_BUCKET, thumb_key, ExtraArgs={'ACL': 'public-read'})
        
        # 5. SAVE URLS TO DB - THIS IS WHAT FIXES PREVIEW
        media.thumbnail_url = f"{settings.B2_ENDPOINT}/{settings.B2_BUCKET}/{thumb_key}"
        media.status = 'completed'
        media.save()
        
        self.update_state(state='SUCCESS', meta={'percent': 100})
        return {'status': 'Completed', 'media_id': media_id}

    except Exception as e:
        if media:
            media.status = 'failed'
            media.error_message = str(e) # add this field to model
            media.save()
        self.update_state(state='FAILED', meta={'percent': 0, 'error': str(e)})
        raise self.retry(exc=e, countdown=60)
    finally:
        if thumb_path and os.path.exists(thumb_path): 
            os.remove(thumb_path)