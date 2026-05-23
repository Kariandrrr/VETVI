from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from .base import BaseSchema
from ..models.enums import MembershipRole


class FamilyGroupBase(BaseModel):
    name: str
    description: str | None = None


class FamilyMembershipRead(BaseModel):
    user_id: UUID
    role: MembershipRole
    joined_at: datetime
    model_config = ConfigDict(from_attributes=True)
    is_favourite: bool = False


class FamilyGroupCreate(FamilyGroupBase):
    pass


class FamilyGroupRead(FamilyGroupBase, BaseSchema):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    memberships: list[FamilyMembershipRead] = []
    model_config = ConfigDict(from_attributes=True)


class FamilyGroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
