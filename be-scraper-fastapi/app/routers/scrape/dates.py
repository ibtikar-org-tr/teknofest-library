from fastapi import APIRouter, Query
from app.services.scrape.dates import call

router = APIRouter()

@router.get("/competition-dates-csv")
async def get_competition_dates(
    lang: str = Query("tr", description="language")
):
    call.process_links(lang)
    return

