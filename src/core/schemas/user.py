from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, BaseModel

from .base import BaseSchema
from ..models.enums import MembershipRole


class UserRead(BaseSchema):
    id: UUID
    email: EmailStr
    display_name: str
    avatar_url: str | None = None
    role: MembershipRole
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    role: MembershipRole = MembershipRole.viewer


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    password: str | bytes | None = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
