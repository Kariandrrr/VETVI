from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel

from .base import BaseSchema
from ..models.enums import GenderEnum


class FamilyMemberBase(BaseModel):
    first_name: str
    last_name: str
    patronymic: str | None = None
    maiden_name: str | None = None
    gender: GenderEnum = GenderEnum.unknown
    birth_date: date | None = None
    birth_place: str | None = None
    death_date: date | None = None
    death_place: str | None = None
    is_alive: bool = True
    bio: str | None = None
    avatar_url: str | None = None


class FamilyMemberCreate(FamilyMemberBase):
    family_group_id: UUID
    linked_user_id: UUID | None = None


class FamilyMemberRead(FamilyMemberBase, BaseSchema):
    id: UUID
    family_group_id: UUID
    linked_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


class FamilyMemberUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    patronymic: str | None = None
    maiden_name: str | None = None
    gender: GenderEnum | None = None
    birth_date: date | None = None
    birth_place: str | None = None
    death_date: date | None = None
    death_place: str | None = None
    is_alive: bool | None = None
    bio: str | None = None
    avatar_url: str | None = None
    linked_user_id: UUID | None = None
