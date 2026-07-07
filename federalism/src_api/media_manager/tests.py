from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from unittest.mock import patch

from .models import MediaFile


class MediaFileSignedUrlTests(TestCase):
    @override_settings(
        AWS_ACCESS_KEY_ID='test-access-key',
        AWS_SECRET_ACCESS_KEY='test-secret-key',
        AWS_S3_ENDPOINT_URL='https://example.supabase.co/storage/v1/s3',
        AWS_STORAGE_BUCKET_NAME='federalism-media',
    )
    @patch('media_manager.views.boto3.client')
    def test_media_file_signed_url_returns_signed_url(self, mock_boto_client):
        User = get_user_model()
        user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        media_file = MediaFile.objects.create(
            user=user,
            title='Test Video',
            slug='test-video',
            media_type='video',
            file='media_files/test.mp4',
            status='draft',
        )

        mock_s3 = mock_boto_client.return_value
        mock_s3.generate_presigned_url.return_value = 'https://signed.example.com/test.mp4'

        url = reverse('media_file_signed_url', args=[media_file.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('signed_url', response.json())
        self.assertEqual(response.json()['signed_url'], 'https://signed.example.com/test.mp4')

        mock_boto_client.assert_called_once()
        mock_s3.generate_presigned_url.assert_called_once_with(
            'get_object',
            Params={'Bucket': 'federalism-media', 'Key': 'media_files/test.mp4'},
            ExpiresIn=300,
        )

    @override_settings(
        AWS_ACCESS_KEY_ID='test-access-key',
        AWS_SECRET_ACCESS_KEY='test-secret-key',
        AWS_S3_ENDPOINT_URL='https://example.supabase.co/storage/v1/s3',
        AWS_STORAGE_BUCKET_NAME='federalism-media',
        AWS_S3_REGION_NAME='us-east-1',
    )
    @patch('media_manager.views.boto3.client')
    def test_media_file_signed_url_returns_signed_media_url(self, mock_boto_client):
        User = get_user_model()
        user = User.objects.create_user(username='testuser2', email='test2@example.com', password='password123')
        media_file = MediaFile.objects.create(
            user=user,
            title='Test Video 2',
            slug='test-video-2',
            media_type='video',
            file='media_files/test2.mp4',
            status='draft',
        )

        mock_s3 = mock_boto_client.return_value
        mock_s3.generate_presigned_url.return_value = 'https://signed.example.com/test2.mp4'

        response = self.client.get(reverse('media_file_signed_url', args=[media_file.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['signed_url'], 'https://signed.example.com/test2.mp4')
        mock_boto_client.assert_called_once()

    @override_settings(
        AWS_ACCESS_KEY_ID='test-access-key',
        AWS_SECRET_ACCESS_KEY='test-secret-key',
        AWS_S3_ENDPOINT_URL='https://example.supabase.co/storage/v1/s3',
        AWS_STORAGE_BUCKET_NAME='federalism-media',
    )
    def test_media_file_signed_url_returns_404_for_missing_media(self):
        url = reverse('media_file_signed_url', args=[9999])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {'error': 'Media file not found.'})
