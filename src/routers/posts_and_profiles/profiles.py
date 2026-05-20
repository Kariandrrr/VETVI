from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.models import FamilyMembership
from ...core.models.enums import MembershipRole
from ...core.models.members import FamilyMember
from ...core.schemas.member_profile import MemberProfileRead, MemberProfileUpdate
from ...deps.family import (
    RoleChecker,
    get_user_role_in_family,
)
from ...deps.user import get_db, get_current_user
from ...service.media_and_profiles import profiles as profile_service

router = APIRouter()


@router.get("/families/{family_group_id}/members/me", response_model=MemberProfileRead)
async def get_my_profile(
    family_group_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == current_user.id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    role = await get_user_role_in_family(db, current_user.id, family_group_id)
    if role is None:
        role = "editor"

    return MemberProfileRead(
        id=member.id,
        user_id=member.linked_user_id,
        family_group_id=member.family_group_id,
        role=role,
        joined_at=member.created_at,
        linked_user_id=member.linked_user_id,
        display_name=member.display_name,
        bio=member.bio,
        avatar_url=member.avatar_url,
        date_of_birth=member.birth_date,
        first_name=member.first_name,
        last_name=member.last_name,
        patronymic=member.patronymic,
        maiden_name=member.maiden_name,
        gender=member.gender,
        birth_place=member.birth_place,
        death_date=member.death_date,
        death_place=member.death_place,
        is_alive=member.is_alive if member.is_alive is not None else True,
    )


@router.get(
    "/families/{family_id}/members/{member_id}", response_model=MemberProfileRead
)
async def get_member_profile(
    family_id: UUID,
    member_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id,
        FamilyMember.family_group_id == family_id,
    )
    result = await db.execute(stmt)
    target_member = result.scalar()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    if target_member.linked_user_id:
        role_enum = await get_user_role_in_family(
            db, target_member.linked_user_id, family_id
        )
        target_role = role_enum
    else:
        target_role = MembershipRole.viewer

    return await profile_service.get_member_profile(
        db, member_id, family_id, role=target_role
    )


@router.get("/families/{family_id}/members", response_model=list[MemberProfileRead])
async def get_all_family_members(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    members = await profile_service.get_all_family_members(db, family_id)
    return members


@router.patch(
    "/families/{family_group_id}/members/{member_id}", response_model=MemberProfileRead
)
async def update_member_profile(
    family_group_id: UUID,
    member_id: UUID,
    data: MemberProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = await get_user_role_in_family(db, current_user.id, family_group_id)

    if role is None:
        raise HTTPException(403, "You are not in this family group")

    if role != MembershipRole.admin:
        raise HTTPException(403, "Admin rights required")

    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == current_user.id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    current_member = result.scalar()

    if not current_member:
        raise HTTPException(404, "Your member profile not found")

    member = await profile_service.update_member_profile(
        db, member_id, data, current_member.id, family_group_id
    )

    return member


@router.patch("/me/profile", response_model=MemberProfileRead)
async def update_my_profile(
    data: MemberProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    stmt = select(FamilyMember).where(FamilyMember.linked_user_id == current_user.id)
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="You are not a member of any family. Please create or join a family first.",
        )

    return await profile_service.update_member_profile(
        db=db,
        member_id=member.id,
        data=data,
        requester_member_id=member.id,
        family_group_id=member.family_group_id,
    )


@router.patch("/families/{family_group_id}/members/{member_id}/role")
async def update_member_role(
    family_group_id: UUID,
    member_id: UUID,
    role_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    admin_role = await get_user_role_in_family(db, current_user.id, family_group_id)
    if admin_role != MembershipRole.admin:
        raise HTTPException(403, "Only admin can change roles")

    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(404, "Member not found")

    if not member.linked_user_id:
        raise HTTPException(400, "Cannot change role for member without account")

    stmt = select(FamilyMembership).where(
        FamilyMembership.user_id == member.linked_user_id,
        FamilyMembership.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    membership = result.scalar()

    if not membership:
        raise HTTPException(404, "Membership not found")

    new_role = role_data.get("role")
    if new_role not in ["admin", "editor", "viewer"]:
        raise HTTPException(400, "Invalid role")

    if membership.role == MembershipRole.admin and new_role != "admin":
        admin_count_stmt = (
            select(func.count())
            .select_from(FamilyMembership)
            .where(
                FamilyMembership.family_group_id == family_group_id,
                FamilyMembership.role == MembershipRole.admin,
            )
        )
        admin_count = await db.scalar(admin_count_stmt)

        if admin_count <= 1:
            raise HTTPException(400, "Cannot remove the last admin of the family")

    membership.role = MembershipRole(new_role)
    await db.commit()
    await db.refresh(membership)

    return {"message": "Role updated successfully", "role": new_role}
