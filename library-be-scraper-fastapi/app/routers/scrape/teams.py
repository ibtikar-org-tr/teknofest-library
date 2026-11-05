from fastapi import APIRouter, Query
from app.services.scrape.teams import call, scrape

router = APIRouter()

@router.get("/teams-page")
async def download_teams_files(
    page: int = Query(..., description="page number"),
    update_downloads: bool = Query(False, description="update downloads"),
    update_database: bool = Query(False, description="update database"),
    year: str = Query(None, description="year")
):
    stats = scrape.scrape_page(page=page, update_downloads=update_downloads, update_database=update_database, year=year)
    
    message = f"Retrieved {stats['teams_retrieved']} team(s) from page {page}"
    if update_downloads:
        message += f", downloaded {stats['reports_downloaded']} report(s) and {stats['intros_downloaded']} intro(s)"
    if update_database:
        message += f", updated {stats['database_updates']} database record(s)"
    if stats['errors'] > 0:
        message += f", encountered {stats['errors']} error(s)"
    
    return {"success": True, "message": message, "stats": stats}

@router.get("/teams-all")
async def download_all_teams_files(
    first_page: int = Query(..., description="first page number"),
    last_page: int = Query(..., description="last page number"),
    update_downloads: bool = Query(False, description="update downloads"),
    update_database: bool = Query(False, description="update database"),
    year: str = Query(None, description="year")
):
    stats = call.scrape_all_links(first_page=first_page, last_page=last_page, update_downloads=update_downloads, update_database=update_database, year=year)
    
    message = f"Processed {stats['pages_processed']} page(s), retrieved {stats['teams_retrieved']} team(s)"
    if update_downloads:
        message += f", downloaded {stats['reports_downloaded']} report(s) and {stats['intros_downloaded']} intro(s)"
    if update_database:
        message += f", updated {stats['database_updates']} database record(s)"
    if stats['errors'] > 0:
        message += f", encountered {stats['errors']} error(s)"
    
    return {"success": True, "message": message, "stats": stats}
