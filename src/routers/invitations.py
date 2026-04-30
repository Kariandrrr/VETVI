from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models.enums import MembershipRole
from ..core.schemas.invitations import (
    InvitationCreate,
    InvitationRead,
    InvitationCreateInput,
)
from ..crud import invitations as invite_service
from ..deps.family import RoleChecker
from ..deps.user import get_db, get_current_user

router = APIRouter()


@router.post("/{family_id}/invites", response_model=InvitationRead)
async def create_invite(
    family_id: UUID,
    invite_in: InvitationCreateInput,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(RoleChecker([MembershipRole.admin])),
):
    full_invite_data = InvitationCreate(
        family_group_id=family_id,
        assigned_role=invite_in.assigned_role,
        max_uses=invite_in.max_uses,
        expires_at=invite_in.expires_at,
    )
    return await invite_service.create_invitation(db, full_invite_data, current_user.id)
