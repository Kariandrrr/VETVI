from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.models import User
from src.core.models.enums import MembershipRole
from src.core.schemas.family_members import (
    FamilyMemberCreate,
    FamilyMemberRead,
    FamilyMemberUpdate,
)
from src.service.member_relationship import members as member_service
from src.deps.family import RoleChecker
from src.deps.user import get_db, get_current_user

router = APIRouter()


@router.post("/members", response_model=FamilyMemberRead, status_code=201)
async def create_family_member(
    member_in: FamilyMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await RoleChecker([MembershipRole.admin, MembershipRole.editor])(
        family_id=member_in.family_group_id,
        current_user=current_user,
        db=db,
    )

    try:
        member = await member_service.create_family_member(
            db, member_in, current_user.id
        )
        return member
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/members/{member_id}", response_model=FamilyMemberRead)
async def get_family_member(
    member_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = await member_service.get_family_member_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    await RoleChecker(
        [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
    )(
        family_id=member.family_group_id,
        current_user=current_user,
        db=db,
    )
    return member


@router.get("/{family_id}/members", response_model=list[FamilyMemberRead])
async def get_family_members_list(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await RoleChecker(
        [MembershipRole.viewer, MembershipRole.admin, MembershipRole.editor]
    )(
        family_id=family_id,
        current_user=current_user,
        db=db,
    )
    return await member_service.get_members_by_family_id(db, family_id)


@router.put("/members/{member_id}", response_model=FamilyMemberRead)
async def update_family_member(
    member_id: UUID,
    member_in: FamilyMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_member = await member_service.get_family_member_by_id(db, member_id)
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")

    await RoleChecker(
        [
            MembershipRole.admin,
            MembershipRole.editor,
        ]
    )(
        family_id=db_member.family_group_id,
        current_user=current_user,
        db=db,
    )
    try:
        member = await member_service.update_family_member(db, db_member, member_in)
        return member
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/members/{member_id}", status_code=204)
async def delete_family_member(
    member_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_member = await member_service.get_family_member_by_id(db, member_id)
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")

    await RoleChecker([MembershipRole.admin])(
        family_id=db_member.family_group_id,
        current_user=current_user,
        db=db,
    )
    await member_service.delete_family_member(db, member_id)
    return {"message": "Member deleted"}
