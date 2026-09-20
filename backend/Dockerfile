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

# Install minimal OS packages required for OpenCV, PyTorch, image processing, Piper TTS, and health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    curl \
    espeak-ng \
    espeak-ng-data \
    libespeak-ng1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies manifest first to leverage Docker layer caching
COPY requirements.txt /app/requirements.txt

# Install PyTorch CUDA 12.8 pinned wheels and project Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        torch==2.11.0 \
        torchvision==0.26.0 \
        --index-url https://download.pytorch.org/whl/cu128 && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend application source code, models, and RAG knowledge base
COPY . /app

# Ensure runtime writable directories exist for models, static media, and audio caches
RUN mkdir -p /app/models/brinjal \
             /app/models/tts/tamil \
             /app/models/tts/english \
             /app/static/predictions \
             /app/static/tts \
             /app/cache/tts \
             /app/cache

# Download Piper TTS models for Tamil and English during Docker build (fails build if download fails)
RUN curl -fSsL -o /app/models/tts/tamil/ta_IN-rasa_female-medium.onnx \
        https://huggingface.co/tinisoft/piper-ta_IN-rasa_female-medium/resolve/main/ta_IN-rasa_female-medium.onnx && \
    curl -fSsL -o /app/models/tts/tamil/ta_IN-rasa_female-medium.onnx.json \
        https://huggingface.co/tinisoft/piper-ta_IN-rasa_female-medium/resolve/main/ta_IN-rasa_female-medium.onnx.json && \
    curl -fSsL -o /app/models/tts/english/en_US-lessac-medium.onnx \
        https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx && \
    curl -fSsL -o /app/models/tts/english/en_US-lessac-medium.onnx.json \
        https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json && \
    test -s /app/models/tts/tamil/ta_IN-rasa_female-medium.onnx && \
    test -s /app/models/tts/english/en_US-lessac-medium.onnx

# Container Healthcheck targeting the safe /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Expose default backend port
EXPOSE 8000

# Production startup command using Uvicorn ASGI server with dynamic PORT binding
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
