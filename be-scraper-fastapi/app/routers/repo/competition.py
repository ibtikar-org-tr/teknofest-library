from fastapi import APIRouter, Query
from app.repositories import competition_crud

router = APIRouter()

@router.get("/competitions") # get all competitions
async def get_competitions():
    competition_crud_class = competition_crud.CompetitionCRUD()
    competitions = competition_crud_class.get_competitions()
    return competitions

@router.get("/competition") # get competition by id
async def get_competition(competition_id: str = Query(..., description="competition id")):
    competition_crud_class = competition_crud.CompetitionCRUD()
    competition = competition_crud_class.get_competition(competition_id)
    return competition