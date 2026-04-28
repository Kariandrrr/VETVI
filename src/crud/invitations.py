import secrets
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models.families import FamilyMembership
from ..core.models.invitation import Invitation
from ..core.schemas.invitations import InvitationCreate


async def create_invitation(
    db: AsyncSession,
    invite_in: InvitationCreate,
    user_id: UUID,
) -> Invitation:
    token = secrets.token_urlsafe(32)

    expires_at = invite_in.expires_at or (datetime.now() + timedelta(days=7))
    db_invite = Invitation(
        family_group_id=invite_in.family_group_id,
        invited_by=user_id,
        token=token,
        assigned_role=invite_in.assigned_role,
        max_uses=invite_in.max_uses,
        expires_at=expires_at,
        times_used=0,
        is_active=True,
    )

    db.add(db_invite)
    await db.commit()
    await db.refresh(db_invite)
    return db_invite


async def get_invitation_by_token(
    db: AsyncSession,
    token: str,
) -> Invitation | None:
    stmt = select(Invitation).where(Invitation.token == token)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def accept_invitation(
    db: AsyncSession,
    user_id: UUID,
    invite: Invitation,
) -> bool:
    stmt_check = select(FamilyMembership).where(
        and_(
            FamilyMembership.user_id == user_id,
            FamilyMembership.family_group_id == invite.family_group_id,
        )
    )
    existing = await db.execute(stmt_check)
    if existing.scalar_one_or_none():
        return False

    new_membership = FamilyMembership(
        user_id=user_id,
        family_group_id=invite.family_group_id,
        role=invite.assigned_role,
    )
    db.add(new_membership)
    invite.times_used += 1

    if invite.times_used >= invite.max_uses:
        invite.is_active = False

    await db.commit()
    return True


async def get_family_invitation(
    db: AsyncSession,
    family_id: UUID,
) -> list[Invitation]:
    stmt = select(Invitation).where(Invitation.family_group_id == family_id)
    result = await db.execute(stmt)
    return result.scalars().all()


async def revoke_invitation(
    db: AsyncSession,
    invite_id: UUID,
) -> bool:
    stmt = select(Invitation).where(Invitation.id == invite_id)
    result = await db.execute(stmt)
    invite = result.scalar_one_or_none()

    if invite:
        invite.is_active = False
        await db.commit()
        return True
    return False
