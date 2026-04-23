from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, BaseModel

from .base import BaseSchema


class UserRead(BaseSchema):
    id: UUID
    email: EmailStr
    display_name: str
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    password: str | bytes | None
