from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.models import FamilyMembership
from ...core.models.enums import MembershipRole
from ...core.models.members import FamilyMember
from ...core.schemas.member_profile import MemberProfileUpdate


async def _get_member_with_user(
    db: AsyncSession,
    member_id: UUID,
    family_group_id: UUID,
) -> FamilyMember | None:
    stmt = (
        select(FamilyMember)
        .options(selectinload(FamilyMember.linked_user))
        .where(
            FamilyMember.id == member_id,
            FamilyMember.family_group_id == family_group_id,
        )
    )
    result = await db.execute(stmt)
    return result.scalar()


def _member_to_response(
    member: FamilyMember, role: MembershipRole | None = None
) -> dict:

    final_role = role if role else MembershipRole.viewer
    return {
        "id": member.id,
        "user_id": member.linked_user_id,
        "family_group_id": member.family_group_id,
        "role": final_role,
        "joined_at": member.created_at,
        "linked_user_id": member.linked_user_id,
        "display_name": member.display_name,
        "bio": member.bio,
        "avatar_url": member.avatar_url,
        "date_of_birth": member.birth_date,
        "first_name": member.first_name,
        "last_name": member.last_name,
        "patronymic": member.patronymic,
        "maiden_name": member.maiden_name,
        "gender": member.gender,
        "birth_place": member.birth_place,
        "death_date": member.death_date,
        "death_place": member.death_place,
        "is_alive": member.is_alive,
    }


async def get_member_profile(
    db: AsyncSession,
    member_id: UUID,
    family_group_id: UUID,
    role: MembershipRole | None = None,
) -> dict:
    member = await _get_member_with_user(db, member_id, family_group_id)

    if not member:
        raise HTTPException(status_code=404, detail="Profile not found")

    final_role = role

    return {
        "id": member.id,
        "user_id": member.linked_user_id,
        "family_group_id": member.family_group_id,
        "role": final_role,
        "joined_at": member.created_at,
        "linked_user_id": member.linked_user_id,
        "display_name": member.display_name,
        "bio": member.bio,
        "avatar_url": member.avatar_url,
        "date_of_birth": member.birth_date,
        "first_name": member.first_name or "",
        "last_name": member.last_name or "",
        "patronymic": member.patronymic,
        "maiden_name": member.maiden_name,
        "gender": member.gender,
        "birth_place": member.birth_place,
        "death_date": member.death_date,
        "death_place": member.death_place,
        "is_alive": member.is_alive if member.is_alive is not None else True,
    }


async def get_all_family_members(
    db: AsyncSession,
    family_group_id: UUID,
) -> list[dict]:
    stmt = (
        select(FamilyMember)
        .options(selectinload(FamilyMember.linked_user))
        .where(FamilyMember.family_group_id == family_group_id)
        .order_by(FamilyMember.created_at.asc())
    )
    result = await db.execute(stmt)
    members = result.scalars().all()
    return [
        {
            "id": m.id,
            "user_id": m.linked_user_id,
            "family_group_id": m.family_group_id,
            "role": m.role,
            "joined_at": m.created_at,
            "linked_user_id": m.linked_user_id,
            "display_name": m.display_name,
            "bio": m.bio,
            "avatar_url": m.avatar_url,
            "date_of_birth": m.birth_date,
            "first_name": m.first_name or "",
            "last_name": m.last_name or "",
            "patronymic": m.patronymic,
            "maiden_name": m.maiden_name,
            "gender": m.gender or "unknown",
            "birth_place": m.birth_place,
            "death_date": m.death_date,
            "death_place": m.death_place,
            "is_alive": m.is_alive if m.is_alive is not None else True,
        }
        for m in members
    ]


async def update_member_profile(
    db: AsyncSession,
    member_id: UUID,
    data: MemberProfileUpdate,
    requester_member_id: UUID,
    family_group_id: UUID,
) -> dict:

    member = await _get_member_with_user(db, member_id, family_group_id)

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

    stmt_membership = select(FamilyMembership).where(
        FamilyMembership.user_id == requester.linked_user_id,
        FamilyMembership.family_group_id == family_group_id,
    )
    result_membership = await db.execute(stmt_membership)
    membership = result_membership.scalar()

    if not membership:
        raise HTTPException(status_code=403, detail="Membership not found")

    is_self = member_id == requester_member_id
    is_admin = membership.role == MembershipRole.admin

    if not (is_self or is_admin):
        raise HTTPException(
            status_code=403,
            detail="Not allowed to edit this profile. Only self or admin.",
        )

    if is_admin and not is_self:
        linked_user = member.linked_user
        is_active_user = linked_user and linked_user.is_active if linked_user else False

        if is_active_user:
            raise HTTPException(
                status_code=403,
                detail="Cannot edit active registered user profile. Only deceased or unregistered members can be edited by admin.",
            )

    if is_admin and not is_self:
        allowed_fields = [
            "first_name",
            "last_name",
            "patronymic",
            "maiden_name",
            "gender",
            "role",
            "birth_date",
            "birth_place",
            "death_date",
            "death_place",
            "is_alive",
            "bio",
            "avatar_url",
            "display_name",
            "date_of_birth",
        ]
    else:
        allowed_fields = [
            "first_name",
            "last_name",
            "patronymic",
            "maiden_name",
            "gender",
            "birth_date",
            "birth_place",
            "bio",
            "avatar_url",
            "display_name",
            "date_of_birth",
        ]

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key not in allowed_fields:
            continue

        if key == "date_of_birth":
            setattr(member, "birth_date", value)
        elif key == "display_name":
            setattr(member, "display_name", value)
        elif key in [
            "first_name",
            "last_name",
            "patronymic",
            "maiden_name",
            "gender",
            "birth_place",
            "death_date",
            "death_place",
            "is_alive",
            "role",
            "bio",
            "avatar_url",
        ]:
            setattr(member, key, value)

    await db.commit()
    await db.refresh(member)

    if member.linked_user_id:
        stmt_membership = select(FamilyMembership).where(
            FamilyMembership.user_id == member.linked_user_id,
            FamilyMembership.family_group_id == family_group_id,
        )
        result_membership = await db.execute(stmt_membership)
        membership = result_membership.scalar()
        role_for_response = membership.role if membership else MembershipRole.viewer
    else:
        role_for_response = MembershipRole.viewer

    return _member_to_response(member, role_for_response)
