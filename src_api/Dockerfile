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
# Assuming your manage.py is inside src_api/
COPY src_api/ .

# Create necessary directories
RUN mkdir -p /app/static /app/media /app/tmp

# Ensure we are in the directory containing manage.py
# If manage.py is in the root of the copied 'src_api' folder, this is correct.
# If manage.py is one level up, you may need to adjust the path or COPY structure.

# Expose port
EXPOSE 8000

# STARTUP COMMAND:
# 1. Run Migrations
# 2. Collect Static Files
# 3. Start Gunicorn
# Note: Ensure 'fed_api' matches your project name (the folder containing wsgi.py)
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 --workers 2 fed_api.wsgi:application"]