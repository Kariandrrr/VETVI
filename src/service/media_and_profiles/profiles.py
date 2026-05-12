from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.models.members import FamilyMember
from ...core.schemas.member_profile import MemberProfileUpdate


async def get_member_profile(
    db: AsyncSession,
    member_id: UUID,
    family_group_id: UUID,
) -> FamilyMember:
    stmt = (
        select(FamilyMember)
        .options(selectinload(FamilyMember.linked_user))
        .where(
            FamilyMember.id == member_id,
            FamilyMember.family_group_id == family_group_id,
        )
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(status_code=404, detail="Profile not found")

    return member


async def get_all_family_members(
    db: AsyncSession,
    family_group_id: UUID,
) -> List[FamilyMember]:
    stmt = (
        select(FamilyMember)
        .options(selectinload(FamilyMember.linked_user))
        .where(FamilyMember.family_group_id == family_group_id)
        .order_by(FamilyMember.created_at.asc())
    )
    result = await db.execute(stmt)
    members = result.scalars().all()
    return list(members)


async def update_member_profile(
    db: AsyncSession,
    member_id: UUID,
    data: MemberProfileUpdate,
    requester_member_id: UUID,
    family_group_id: UUID,
) -> FamilyMember:
    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id, FamilyMember.family_group_id == family_group_id
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(status_code=404, detail="Profile not found")

    stmt = select(FamilyMember).where(
        FamilyMember.id == requester_member_id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    requester = result.scalar()

    if not requester:
        raise HTTPException(status_code=403, detail="Not a member of this family")

    is_self = member_id == requester_member_id
    is_admin = requester.role == "admin"

    if not (is_self or is_admin):
        raise HTTPException(
            status_code=403,
            detail="Not allowed to edit this profile. Only self or admin.",
        )

    update_data = data.model_dump(exclude_unset=True)
    allowed_fields = ["date_of_birth"]

    for key, value in update_data.items():
        if key in allowed_fields:
            setattr(member, key, value)

    await db.commit()
    await db.refresh(member)

    stmt = (
        select(FamilyMember)
        .options(selectinload(FamilyMember.linked_user))
        .where(FamilyMember.id == member_id)
    )
    result = await db.execute(stmt)
    member = result.scalar()

    return member
