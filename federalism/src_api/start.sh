#!/bin/bash

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Celery Worker..."
celery -A fed_api worker -l info --concurrency=1 &

echo "Starting Celery Beat..."
celery -A fed_api beat -l info &

echo "Starting Gunicorn..."
gunicorn fed_api.wsgi:application --bind 0.0.0.0:8000 --workers 2