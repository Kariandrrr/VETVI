from uuid import UUID

from pydantic import EmailStr

from .base import BaseSchema


class InternalUsageAuth(BaseSchema):
    id: UUID
    email: EmailStr
    hashed_password: str
    is_active: bool
