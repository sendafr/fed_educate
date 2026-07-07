from celery import shared_task
from.models import MediaUpload
import os
import subprocess
from django.core.files import File


@shared_task(bind=True, max_retries=3)
def process_media_task(self, media_id):
    media = None
    total_steps = 3
    try:
        media = MediaUpload.objects.get(id=media_id)
        
        # STEP 1
        self.update_state(state='PROGRESS', meta={'current': 1, 'total': total_steps, 'percent': 33, 'status': 'Processing media...'})
        
        # STEP 2 
        self.update_state(state='PROGRESS', meta={'current': 2, 'total': total_steps, 'percent': 66, 'status': 'Generating thumbnail...'})
        
        # STEP 3
        self.update_state(state='PROGRESS', meta={'current': 3, 'total': total_steps, 'percent': 90, 'status': 'Finalizing...'})
        # media.duration = get_video_duration(media.file.path)
        
        # DONE
        media.status = 'completed'
        media.save()
        self.update_state(state='SUCCESS', meta={'current': 3, 'total': total_steps, 'percent': 100, 'status': 'Completed', 'media_id': media_id})
        return {'percent': 100, 'status': 'Completed', 'media_id': media_id}
        
    except MediaUpload.DoesNotExist:
        self.update_state(state='FAILURE', meta={'percent': 0, 'status': 'Media not found'})
        return {'percent': 0, 'status': 'Media not found'}
        
    except Exception as exc:
        if media:
            media.status = 'failed'
            media.save()
        self.update_state(state='FAILURE', meta={'percent': 0, 'status': f'Error: {str(exc)}'})
        raise self.retry(exc=exc, countdown=60) # retry in 60s
"""
@shared_task(bind=True, max_retries=3)
def process_media_task(self, media_id):
    media = None
    try:
        media = MediaUpload.objects.get(id=media_id)
        total_steps = 3
        
        # STEP 0: Mark processing
        media.status = 'processing'
        media.save()
        self.update_state(state='PROGRESS', meta={
            'current': 0, 'total': total_steps, 'percent': 0, 
            'status': 'Queued...'
        })

        # STEP 1: Start
        self.update_state(state='PROGRESS', meta={
            'current': 1, 'total': total_steps, 'percent': 33, 
            'status': 'Processing media...'
        })

        # STEP 2: HEAVY WORK - Thumbnail for video
        if media.media_type == 'video' and not media.thumbnail:
            self.update_state(state='PROGRESS', meta={
                'current': 2, 'total': total_steps, 'percent': 66, 
                'status': 'Generating thumbnail...'
            })
            print(f"Processing video {media.id}...")
            
            # Example ffmpeg thumbnail
            thumb_path = f"{media.file.path}_thumb.jpg"
            subprocess.run([
                'ffmpeg', '-i', media.file.path, 
                '-ss', '00:00:01', '-vframes', '1', thumb_path, '-y'
            ], check=True)
            
            with open(thumb_path, 'rb') as f:
                media.thumbnail.save(f"{media.id}_thumb.jpg", File(f))

        # STEP 3: Update duration, filesize etc
        self.update_state(state='PROGRESS', meta={
            'current': 3, 'total': total_steps, 'percent': 90, 
            'status': 'Finalizing...'
        })
        # Example: media.duration = get_video_duration(media.file.path)

        # DONE
        media.status = 'completed'
        media.save()
        self.update_state(state='SUCCESS', meta={
            'current': 3, 'total': total_steps, 'percent': 100, 
            'status': 'Completed', 'media_id': media_id
        })
        return {'percent': 100, 'status': 'Completed', 'media_id': media_id}

    except MediaUpload.DoesNotExist:
        self.update_state(state='FAILURE', meta={'percent': 0, 'status': 'Media not found'})
        return {'percent': 0, 'status': 'Media not found'}
        
    except Exception as exc:
        if media:
            media.status = 'failed'
            media.save()
        self.update_state(state='FAILURE', meta={'percent': 0, 'status': f'Error: {str(exc)}'})
        # Mark as failed and retry
        raise self.retry(exc=exc, countdown=60)"""