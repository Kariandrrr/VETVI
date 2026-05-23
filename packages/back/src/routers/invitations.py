from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models import FamilyMembership
from ..core.models.enums import MembershipRole
from ..core.schemas.invitations import (
    InvitationCreate,
    InvitationRead,
    InvitationCreateInput,
)
from ..service import invitations as invite_service
from ..deps.family import RoleChecker
from ..deps.user import get_db, get_current_user

router = APIRouter()


@router.post("/{family_id}/invites", response_model=InvitationRead, status_code=201)
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


@router.get("/invites/{family_id}")
async def get_family_invites(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = await db.execute(
        select(FamilyMembership).where(
            and_(
                FamilyMembership.family_group_id == family_id,
                FamilyMembership.user_id == current_user.id,
            )
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    invites = await invite_service.get_family_invitation(db, family_id)
    return invites


@router.delete("/invites/{family_id}/{invite_id}", status_code=204)
async def delete_invite(
    invite_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(RoleChecker([MembershipRole.admin])),
):
    success = await invite_service.delete_invite(db, invite_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Invitation not found or already revoked"
        )
    return {"status": "success", "message": "Invitation successfully deleted"}
