# Lightweight image to run the file sync watcher
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (minimal; add build-essential if new deps require compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY sync_r2.py ./

# Default command runs initial sync then watches for changes
CMD ["python", "sync_r2.py"]
