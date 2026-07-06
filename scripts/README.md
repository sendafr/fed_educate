# Backend Signed URL Test

This script validates the `media_file_signed_url` endpoint and confirms the returned signed URL is reachable.

## Requirements

- Python 3
- The Django backend running at `http://localhost:8000` or another host you provide

## Usage

```bash
cd /home/fred/Documents/fed-educ
python3 scripts/test_signed_url.py http://localhost:8000
```

If you use a different backend host, pass it as the first argument.

## Notes

- The script currently tests `media_id=1`. Update the ID in `scripts/test_signed_url.py` if needed.
- The endpoint must be available at `/api/media_manager/media_file/<id>/signed_url/`.
