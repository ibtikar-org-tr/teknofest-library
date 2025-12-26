from fastapi import APIRouter, Query
from app.routers.repo import competition

router = APIRouter()

router.include_router(competition.router, tags=["competitions"])
