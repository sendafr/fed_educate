FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/static /app/media /app/tmp /var/log/supervisor

# Copy supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port
EXPOSE 8000

# Startup Command:
# 1. Run Migrations
# 2. Collect Static Files
# 3. Start Supervisor (which manages Gunicorn and Celery)
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && supervisord -c /etc/supervisor/conf.d/supervisord.conf"]