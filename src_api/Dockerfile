FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src_api/ .

# Create necessary directories
RUN mkdir -p /app/static /app/media /app/tmp

# Expose port
EXPOSE 8000

# STARTUP COMMAND:
# 1. Run Migrations (now that DB is reachable)
# 2. Collect Static Files
# 3. Start Gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 --workers 2 fed_api.wsgi:application"]