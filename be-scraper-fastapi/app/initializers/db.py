from sqlmodel import SQLModel, create_engine, Session
from app.initializers import env

DATABASE_URL = f"postgresql+psycopg2://{env.DB_USER}:{env.DB_PASSWORD}@{env.DB_HOST}:{env.DB_PORT}/{env.DB_NAME}"

engine = create_engine(DATABASE_URL)

def get_session():
    return Session(engine)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)