from fastapi import APIRouter, Query
from app.services.scrape.competitions import links_service, scrape
from app.services.unify.function import find_original_sentence
from app.services.repo_additional import bulk_competition_service
router = APIRouter()

@router.get("/competition-scrape")
async def scrape_competition(
    link: str = Query(..., description="competition link"),
    check_prev_year_reports: bool = Query(False, description="check previous year reports"),
    update_downloads: bool = Query(False, description="update downloads"),
    update_database: bool = Query(False, description="update database"),
    year: str = Query(None, description="year")
):
    status_code, result = scrape.scrape_link(link=link, check_prev_year_reports=check_prev_year_reports, update_downloads=update_downloads, update_database=update_database, year=year)
    return {"status_code": status_code, "result": result}

@router.get("/competition-scrape-all")
async def scrape_all_competitions(
    lang: str = Query("tr", description="language"),
    check_prev_year_reports: bool = Query(False, description="check previous year reports"),
    update_downloads: bool = Query(False, description="update downloads"),
    update_database: bool = Query(False, description="update database"),
    year: str = Query(None, description="year")
):
    scrape.scrape_all_links(lang=lang, check_prev_year_reports=check_prev_year_reports, update_downloads=update_downloads, update_database=update_database, year=year)
    return

@router.get("/competition-links")
async def get_competition_links(
    lang: str = Query("tr", description="language")
):
    return links_service.get_all_links(lang)

@router.get("/competition-link-names")
async def get_competition_link_names(
    lang: str = Query("tr", description="language")
):
    return links_service.get_all_link_names(lang)

@router.get("/competition-names")
async def get_competition_names(
    lang: str = Query("tr", description="language")
):
    return links_service.get_all_name(lang)

@router.get("/find-competition-name")
async def find_comp_name(
    name: str = Query(..., description="competition name"),
    threshold: float = Query(0.5, description="similarity threshold")
):
    return find_original_sentence(sentence=name, threshold=threshold)

@router.post("/bulk-create-update-competitions")
async def bulk_create_update_competitions(
    source: str = Query("lists", description="Data source: 'lists' for local CSV file or 'remote' for website scraping"),
    year: str = Query(None, description="Year to scrape data from (only for remote source)")
):
    """
    Create or update all competitions in the database with multilingual data.
    
    Two modes available:
    1. 'lists' (default): Uses predefined competition lists from CSV file
       - Gets TR/EN/AR names and links from lists.csv
       - Scrapes descriptions, images, and application links from pages
       - All 54 competitions with complete multilingual data
    
    2. 'remote': Dynamically fetches from website
       - Scrapes competition links from teknofest.org
       - Only processes TR and EN versions (AR not available on remote)
       - Optionally specify year for historical data
    
    Parameters:
    - source: 'lists' or 'remote' (default: 'lists')
    - year: Competition year for remote scraping (optional, defaults to current year)
    
    Returns a summary including number of competitions created, updated, and failed.
    """
    results = bulk_competition_service.bulk_create_update_competitions_multilingual(
        source=source,
        year=year
    )
    return {
        "status": "success",
        "summary": {
            "created": results['created'],
            "updated": results['updated'],
            "failed": results['failed'],
            "total": results['created'] + results['updated'] + results['failed']
        },
        "details": results['details']
    }
