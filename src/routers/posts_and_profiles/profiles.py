from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.models import FamilyMember
from ...core.models.enums import MembershipRole
from ...core.schemas.member_profile import MemberProfileRead, MemberProfileUpdate
from ...deps.family import RoleChecker, get_current_member_in_family
from ...deps.user import get_db
from ...service.media_and_profiles import profiles as profile_service

router = APIRouter()


@router.get("/families/{family_group_id}/members/me", response_model=MemberProfileRead)
async def get_my_profile(
    current_member: FamilyMember = Depends(get_current_member_in_family),
):
    return MemberProfileRead(
        id=current_member.id,
        user_id=current_member.linked_user_id,
        family_group_id=current_member.family_group_id,
        role=current_member.role,
        joined_at=current_member.created_at,
        linked_user_id=current_member.linked_user_id,
        display_name=current_member.display_name,
        bio=current_member.bio,
        avatar_url=current_member.avatar_url,
        date_of_birth=current_member.birth_date,
        first_name=current_member.first_name,
        last_name=current_member.last_name,
        patronymic=current_member.patronymic,
        maiden_name=current_member.maiden_name,
        gender=current_member.gender,
        birth_place=current_member.birth_place,
        death_date=current_member.death_date,
        death_place=current_member.death_place,
        is_alive=(
            current_member.is_alive if current_member.is_alive is not None else True
        ),
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
    return await profile_service.get_member_profile(db, member_id, family_id)


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
    current_member=Depends(get_current_member_in_family),
):
    member = await profile_service.update_member_profile(
        db, member_id, data, current_member.id, family_group_id
    )
    return member
