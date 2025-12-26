from fastapi import APIRouter, Query
from app.services.scrape.competitions import links_service, scrape
from app.services.unify.function import find_original_sentence
router = APIRouter()

@router.get("/competition-scrape")
async def scrape_competition(
    link: str = Query(..., description="competition link"),
    check_prev_year_reports: bool = Query(False, description="check previous year reports"),
    update_downloads: bool = Query(False, description="update downloads"),
    update_database: bool = Query(False, description="update database"),
    year: str = Query(None, description="year")
):
    scrape.scrape_link(link=link, check_prev_year_reports=check_prev_year_reports, update_downloads=update_downloads, update_database=update_database, year=year)
    return

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
async def get_competition_names(
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
    name: str = Query(..., description="competition name")
):
    return find_original_sentence(sentence=name)
