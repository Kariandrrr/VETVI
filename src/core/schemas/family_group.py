from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from .base import BaseSchema


class FamilyGroupBase(BaseModel):
    name: str
    description: str | None = None


class FamilyGroupCreate(FamilyGroupBase):
    pass


class FamilyGroupRead(FamilyGroupBase, BaseSchema):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class FamilyGroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
