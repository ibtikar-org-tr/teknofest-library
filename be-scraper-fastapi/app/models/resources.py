from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.types import JSON
from typing import Optional
from datetime import datetime, timezone
import uuid

class Resource(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default=datetime.now(timezone.utc))
    updated_at: datetime = Field(default=datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    competition_id: uuid.UUID # The competition that the resource is related to
    team_id: uuid.UUID # The team that created the resource
    resource_type: str # GitHub, Youtube, Google Drive, etc.
    resource_url: str
    description: str
    year: int # The year that the resource is created
    comments: Optional[list[uuid.UUID]] = Field(default=None, sa_column=Column(JSON))