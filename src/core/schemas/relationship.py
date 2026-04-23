from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from .base import BaseSchema
from ..models.enums import RelationshipType


class RelationshipBase(BaseModel):
    from_member_id: UUID
    to_member_id: UUID
    rel_type: RelationshipType
    marriage_date: date | None = None
    divorce_date: date | None = None


class RelationshipCreate(RelationshipBase):
    family_group_id: UUID


class RelationshipRead(RelationshipBase, BaseSchema):
    id: UUID
    family_group_id: UUID
    created_by: UUID
    created_at: datetime


class RelationshipUpdate(BaseModel):
    rel_type: RelationshipType | None = None
    marriage_date: date | None
    divorce_date: date | None
