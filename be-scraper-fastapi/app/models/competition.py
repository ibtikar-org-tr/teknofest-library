from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.types import JSON
from typing import Optional
from datetime import datetime, timezone
import uuid

class Competition(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    image_path: str
    # is_open: bool
    tk_number: Optional[str] = None # used in the Teams page
    t3kys_number: Optional[str] = None # used in the t3kys platform
    application_link_tr: Optional[str] = None
    application_link_en: Optional[str] = None
    application_link_ar: Optional[str] = None
    tr_name: Optional[str] = None
    tr_description: Optional[str] = None
    tr_link: Optional[str] = None
    en_name: Optional[str] = None
    en_description: Optional[str] = None
    en_link: Optional[str] = None
    ar_name: Optional[str] = None
    ar_description: Optional[str] = None
    ar_link: Optional[str] = None
    years: list[str] = Field(default_factory=list, sa_column=Column(JSON)) # The years that the competition is held
    min_member: Optional[int] = None # Minimum number of members in a team
    max_member: Optional[int] = None # Maximum number of members in a team
    # comments: list[uuid.UUID]

class Report_File(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default=datetime.utcnow)
    updated_at: datetime = Field(default=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    competition_id: uuid.UUID
    team_id: Optional[uuid.UUID] = None
    year: str
    file_path: str
    rank: Optional[str] = None  # "finalist", "derece"
    stage : Optional[str] = None  # "critical-design", "pre-assessment", "final-assessment", "final-presentation"
    language: Optional[str] = None  # "tr", "en", "ar"

class Result_File(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default=datetime.utcnow)
    updated_at: datetime = Field(default=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    competition_id: uuid.UUID
    year: str
    stage: str # "final", "pre-assessment"
    file_path: str