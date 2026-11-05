from fastapi import APIRouter, Query
from app.routers import scrape_routers
from app.routers import repo_routers

router = APIRouter()

router.include_router(scrape_routers.router, prefix="/api/scrape")
router.include_router(repo_routers.router, prefix="/api/repo")

@router.get("/")
async def root():
    return {"message": "Hello World"}