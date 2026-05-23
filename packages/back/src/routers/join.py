from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models import GenderEnum
from ..service.member_relationship.members import (
    create_family_member,
)
from ..service.member_relationship.relationships import get_member_by_linked_user
from ..core.schemas.family_members import FamilyMemberCreate
from ..service import invitations as invite_service
from ..deps.user import get_db, get_current_user

router = APIRouter()


@router.post("/{token}")
async def join_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invite = await invite_service.get_invitation_by_token(db, token)
    if not invite or not invite.is_active:
        raise HTTPException(status_code=404, detail="Invitation not found")

    now = datetime.now(timezone.utc)
    print(f"DEBUG: DB Time: {invite.expires_at} | Type: {type(invite.expires_at)}")
    print(f"DEBUG: Now Time: {now} | Type: {type(now)}")

    if invite.expires_at < now:
        raise HTTPException(
            status_code=400, detail=f"Expired. DB: {invite.expires_at} < Now: {now}"
        )

    if invite.times_used >= invite.max_uses:
        raise HTTPException(status_code=400, detail="Invitation usage limit reached")

    success = await invite_service.accept_invitation(
        db,
        current_user.id,
        invite.id,
    )
    if not success:
        raise HTTPException(
            status_code=400, detail="You are already a member of this family group"
        )

    existing_member = await get_member_by_linked_user(
        db, invite.family_group_id, current_user.id
    )
    if not existing_member:
        default_name = getattr(current_user, "display_name", "Участник")

        member_in = FamilyMemberCreate(
            family_group_id=invite.family_group_id,
            first_name=default_name,
            last_name="",
            gender=GenderEnum.unknown,
            avatar_url=getattr(current_user, "avatar_url", None),
            linked_user_id=current_user.id,
        )

        new_member = await create_family_member(db, member_in, current_user.id)
        await db.commit()
        await db.refresh(new_member)

    return {
        "status": "success",
        "family_id": invite.family_group_id,
        "role": invite.assigned_role,
    }
