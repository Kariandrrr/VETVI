from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from src.core.models.enums import MembershipRole, GenderEnum


class MemberProfileBase(BaseModel):
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = Field(None, max_length=500)
    date_of_birth: date | None = None


class MemberProfileCreate(MemberProfileBase):
    user_id: UUID
    family_group_id: UUID
    role: MembershipRole = MembershipRole.viewer


class MemberProfileUpdate(MemberProfileBase):
    first_name: str | None = None
    last_name: str | None = None
    patronymic: str | None = None
    maiden_name: str | None = None
    gender: GenderEnum | None = None
    birth_place: str | None = None
    death_date: date | None = None
    death_place: str | None = None
    is_alive: bool | None = None


class MemberProfileRead(MemberProfileBase):
    id: UUID
    user_id: UUID | None = None
    family_group_id: UUID
    role: MembershipRole
    joined_at: datetime
    linked_user_id: UUID | None = None

    first_name: str = ""
    last_name: str = ""
    patronymic: str | None = None
    maiden_name: str | None = None
    gender: GenderEnum | None = None
    birth_place: str | None = None
    death_date: date | None = None
    death_place: str | None = None
    is_alive: bool = True

    model_config = ConfigDict(from_attributes=True)
