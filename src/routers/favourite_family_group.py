from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models import FamilyMembership
from ..core.models.users import User
from ..deps.user import get_db, get_current_user

router = APIRouter()


@router.patch("/{family_id}/favourite", status_code=200)
async def set_fav_family(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        update(FamilyMembership)
        .where(FamilyMembership.user_id == current_user.id)
        .values(is_favourite=False)
    )

    membership = await db.execute(
        select(FamilyMembership).where(
            FamilyMembership.user_id == current_user.id,
            FamilyMembership.family_group_id == family_id,
        )
    )
    membership = membership.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=404, detail="You are not a member of this family group"
        )

    membership.is_favourite = True
    await db.commit()

    return {"status": "success"}


@router.patch("/favourite/unset", status_code=200)
async def unset_fav_family(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        update(FamilyMembership)
        .where(FamilyMembership.user_id == current_user.id)
        .values(is_favourite=False)
    )
    await db.commit()

    return {"status": "success"}
