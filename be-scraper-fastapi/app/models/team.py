from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlalchemy.dialects.postgresql import ARRAY, INTEGER
from typing import Optional
from datetime import datetime, timezone
import uuid

class Team(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    description: str
    stage: Optional[str] = None # University, High School, Middle School, etc.
    institution_name: Optional[str] = None
    member_count: Optional[int] = None
    tap_members: Optional[list[uuid.UUID]] = Field(default=None, sa_column=Column(JSON))
    members_list: Optional[list[str]] = Field(default=None, sa_column=Column(JSON))
    leader: Optional[uuid.UUID] = None
    competition_id: uuid.UUID
    years: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(JSON)))
    status: Optional[str] = None # "finalist", "derece", "etc"
    rank: Optional[int] = None
    relation: Optional[str] = None # central, related, friend, None
    intro_file_path: Optional[str] = None
    team_link: Optional[str] = None