#!/bin/bash
set -e

echo "Starting Celery Worker..."
celery -A core worker -l info --concurrency=1 --max-tasks-per-child=1 --time-limit=1200 &

echo "Starting Celery Beat..."
celery -A core beat -l info &

echo "Starting Gunicorn..."
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --forwarded-allow-ips=*

wait