from fastapi import APIRouter, Query
from app.services.scrape.dates import call

router = APIRouter()

@router.get("/competition-dates-csv")
async def get_competition_dates(
    lang: str = Query("tr", description="language")
):
    call.process_links(lang)
    return

@router.get("/competition-dates-json")
async def get_competition_dates_json(
    lang: str = Query("tr", description="language"),
    file_name: str = Query("competition_dates.json", description="Output JSON file name")
):
    call.process_links_json(lang, file_name)
    return {"message": "Competition dates data successfully written to JSON file", "file": file_name}

