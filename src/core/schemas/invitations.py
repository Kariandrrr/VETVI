from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from .base import BaseSchema
from ..models.enums import MembershipRole


class InvitationBase(BaseModel):
    family_group_id: UUID
    assigned_role: MembershipRole = MembershipRole.editor
    max_uses: int = 1
    expires_at: datetime


class InvitationCreate(InvitationBase):
    pass


class InvitationRead(InvitationBase, BaseSchema):
    id: UUID
    invited_by: UUID
    token: str
    times_used: int
    is_active: bool
    created_at: datetime


class InvitationUpdate(BaseModel):
    assigned_role: MembershipRole | None = None
    max_uses: int | None = None
    expires_at: datetime | None = None
    is_active: bool | None = None
