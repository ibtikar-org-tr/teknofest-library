# FastAPI Scraper

A FastAPI-based web scraper for Teknofest competition data.

## Installation

### Local Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
uvicorn app.main:app --reload --port 9666
```

The API will be available at `http://localhost:9666`

### Docker Setup

1. Build the Docker image:
```bash
docker build -t teknofest-scraper .
```

2. Run the container:
```bash
docker run -p 9666:9666 -v $(pwd)/downloads:/app/downloads teknofest-scraper
```

The `-v` flag mounts the local `downloads` directory to persist scraped files.

## Features

- Web scraping of Teknofest competition data
- FastAPI REST endpoints
- SQLAlchemy ORM with SQLModel
- Database migrations with Alembic
- PDF document handling with PyPDF2
- BeautifulSoup for HTML parsing

## API Documentation

Once running, visit `http://localhost:9666/docs` for interactive API documentation (Swagger UI)

## Project Structure

```
be-scraper-fastapi/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── models/           # Data models
│   ├── routers/          # API routes
│   ├── repositories/     # Database operations
│   ├── services/         # Business logic
│   └── initializers/     # Application initialization
├── alembic/              # Database migrations
├── downloads/            # Scraped files (mounted volume in Docker)
├── Dockerfile            # Docker configuration
├── requirements.txt      # Python dependencies
└── README.md
```