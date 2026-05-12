from uuid import UUID
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class MemberProfileBase(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=500)
    date_of_birth: Optional[date] = None


class MemberProfileCreate(MemberProfileBase):
    user_id: UUID
    family_group_id: UUID
    role: str = "member"


class MemberProfileUpdate(MemberProfileBase):
    pass


class MemberProfileRead(MemberProfileBase):
    id: UUID
    user_id: UUID
    family_group_id: UUID
    role: str
    joined_at: datetime
    linked_user_id: UUID

    class Config:
        from_attributes = True
