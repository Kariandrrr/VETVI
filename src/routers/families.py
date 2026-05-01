from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models import User
from ..core.models.enums import MembershipRole
from ..core.schemas.family_group import (
    FamilyGroupCreate,
    FamilyGroupRead,
)
from ..crud import families as family_service
from ..deps.family import RoleChecker
from ..deps.user import get_db, get_current_user

router = APIRouter()


@router.post("/", response_model=FamilyGroupRead)
async def create_families_group(
    family_in: FamilyGroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    family = await family_service.create_family_group(db, family_in, current_user.id)
    await db.refresh(family, attribute_names=["memberships"])
    return family


@router.get("/me", response_model=List[FamilyGroupRead])
async def get_my_families(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await family_service.get_user_family_list(db, current_user.id)


@router.get("/{family_id}", response_model=FamilyGroupRead)
async def get_family_details(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    family = await family_service.get_single_family_by_id(db, family_id)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    return family


@router.delete("/{family_id}/members/{user_id}")
async def remove_family_member(
    family_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(RoleChecker([MembershipRole.admin])),
):
    success = await family_service.remove_member_from_family(db, family_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found in this family")
    return {"status": "member removed"}


@router.delete("/{family_id}")
async def delete_family_group(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(RoleChecker([MembershipRole.admin])),
) -> None:
    await family_service.delete_family_group(db, family_id)
    return None
