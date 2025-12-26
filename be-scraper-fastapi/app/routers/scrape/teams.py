from fastapi import APIRouter, Query
from app.services.scrape.teams import call, scrape

router = APIRouter()

@router.get("/teams-page")
async def download_teams_files(
    page: int = Query(..., description="page number"),
    update_downloads: bool = Query(False, description="update downloads"),
    update_database: bool = Query(False, description="update database")
):
    scrape.scrape_page(page=page, update_downloads=update_downloads, update_database=update_database)
    return

@router.get("/teams-all")
async def download_all_teams_files(
    first_page: int = Query(..., description="first page number"),
    last_page: int = Query(..., description="last page number"),
    update_downloads: bool = Query(False, description="update downloads"),
    update_database: bool = Query(False, description="update database")
):
    call.scrape_all_links(first_page=first_page, last_page=last_page, update_downloads=update_downloads, update_database=update_database)
    return
