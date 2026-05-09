from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.schemas.family_members import FamilyMemberCreate
from ..crud import invitations as invite_service
from ..crud.members import get_member_by_linked_user, create_family_member
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
        member_in = FamilyMemberCreate(
            family_group_id=invite.family_group_id,
            first_name=current_user.first_name or "Участник",
            last_name=current_user.last_name or "",
            gender=current_user.gender or "unknown",
            avatar_url=getattr(current_user, "avatar_url", None),
            linked_user_id=current_user.id,
        )
        await create_family_member(db, member_in, current_user.id)

    return {
        "status": "success",
        "family_id": invite.family_group_id,
        "role": invite.assigned_role,
    }
