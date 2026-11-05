from fastapi import FastAPI
from app.routers import all_routers
from app.initializers import dir

app = FastAPI()

app.include_router(all_routers.router)

# initializers
dir.set_working_directory()
