from fastapi import APIRouter, Query
from app.services.scrape import announcements

router = APIRouter()

@router.get("/announcements-files")
async def download_announcements_files(
    year: int = Query(2025, description="year"),
    firstpage: int = Query(1, description="first page number"),
    lastpage: int = Query(3, description="last page number"),
    lang: str = Query("tr", description="language")
):
    announcements.call.main(year, firstpage, lastpage, lang)
    return
