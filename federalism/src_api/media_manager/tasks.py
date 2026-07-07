from celery import shared_task
from .models import MediaUpload
from django.core.files import File
import tempfile
import os

@shared_task(bind=True, max_retries=3)
def process_media_task(self, media_id):
    media = None
    try:
        media = MediaUpload.objects.get(id=media_id)
        
        # Mark as processing
        media.status = 'processing'
        media.save()
        
        self.update_state(state='PROGRESS', meta={'current': 1, 'total': 3, 'percent': 33, 'status': 'Downloading media...'})

        # Download file from S3 to a temporary local file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(media.file.name)) as tmp_file:
            tmp_path = tmp_file.name
            # Open the S3 file and write to temp
            with media.file.open('rb') as s3_file:
                tmp_file.write(s3_file.read())

        try:
            self.update_state(state='PROGRESS', meta={'current': 2, 'total': 3, 'percent': 66, 'status': 'Generating thumbnail...'})
            
            # Run ffmpeg on the local temp file
            thumb_path = f"{tmp_path}_thumb.jpg"
            subprocess.run([
                'ffmpeg', '-i', tmp_path, 
                '-ss', '00:00:01', '-vframes', '1', thumb_path, '-y'
            ], check=True, timeout=120)

            # Upload thumbnail back to S3
            with open(thumb_path, 'rb') as f:
                media.thumbnail.save(f"{media.id}_thumb.jpg", File(f))
            
        finally:
            # Cleanup temp files
            if os.path.exists(tmp_path): os.remove(tmp_path)
            if os.path.exists(thumb_path): os.remove(thumb_path)

        media.status = 'completed'
        media.save()
        self.update_state(state='SUCCESS', meta={'current': 3, 'total': 3, 'percent': 100, 'status': 'Completed'})
        return {'status': 'Completed', 'media_id': media_id}

    except Exception as exc:
        if media:
            media.status = 'failed'
            media.save()
        raise self.retry(exc=exc, countdown=60)