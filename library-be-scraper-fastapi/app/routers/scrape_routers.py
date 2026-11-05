from fastapi import APIRouter, Query
from app.routers.scrape import competitions, dates, teams, announcements

router = APIRouter()

router.include_router(competitions.router, tags=["competitions"])
router.include_router(dates.router, tags=["dates"])
router.include_router(teams.router, tags=["teams"])
router.include_router(announcements.router, tags=["announcements"])