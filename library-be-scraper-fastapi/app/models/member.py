from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.types import JSON
from typing import Optional
from datetime import datetime, timezone
import uuid

class Member(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default=datetime.now(timezone.utc))
    updated_at: datetime = Field(default=datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    ar_name: str
    en_name: str
    membership_number: str
    email: str
    phone: str
    university: str
    major: str
    year: int
    sex: str
    birthdate: datetime
    country: str
    city: str
    district: str
    team_ids: Optional[list[uuid.UUID]] = Field(default=None, sa_column=Column(JSON))
    status: str
    is_advisor: bool
    is_leader: bool
    skills: Optional[list[str]] = Field(default=None, sa_column=Column(JSON))
    rating: int
    comments: Optional[list[uuid.UUID]] = Field(default=None, sa_column=Column(JSON))