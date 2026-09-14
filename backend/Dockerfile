# ==============================================================================
# SmartFarm AI Backend — Production Dockerfile
# Base: Python 3.12 Slim (Debian Bookworm)
# ==============================================================================

FROM python:3.12-slim-bookworm

# Set Python environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    ENVIRONMENT=production \
    PIP_NO_CACHE_DIR=1

# Set working directory inside container
WORKDIR /app

# Install minimal OS packages required for OpenCV, PyTorch, image processing, and health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies manifest first to leverage Docker layer caching
COPY requirements.txt /app/requirements.txt

# Install PyTorch CPU wheels and project Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend application source code, models, and RAG knowledge base
COPY . /app

# Ensure runtime writable directories exist for static media and audio caches
RUN mkdir -p /app/static/predictions \
             /app/static/tts \
             /app/cache/tts \
             /app/cache

# Container Healthcheck targeting the safe /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Expose default backend port
EXPOSE 8000

# Production startup command using Uvicorn ASGI server with dynamic PORT binding
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
