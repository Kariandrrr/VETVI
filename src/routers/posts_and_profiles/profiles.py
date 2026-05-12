from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.models.enums import MembershipRole
from ...core.schemas.member_profile import MemberProfileRead, MemberProfileUpdate
from ...deps.family import RoleChecker, get_current_member_in_family
from ...deps.user import get_db
from ...service.media_and_profiles import profiles as profile_service

router = APIRouter()


@router.get("/families/{family_group_id}/members/me", response_model=MemberProfileRead)
async def get_my_profile(
    current_member=Depends(get_current_member_in_family),
):
    return MemberProfileRead.model_validate(current_member)


@router.get(
    "/families/{family_group_id}/members/{member_id}", response_model=MemberProfileRead
)
async def get_member_profile(
    family_group_id: UUID,
    member_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    return await profile_service.get_member_profile(db, member_id, family_group_id)


@router.get(
    "/families/{family_group_id}/members", response_model=List[MemberProfileRead]
)
async def get_all_family_members(
    family_group_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    return await profile_service.get_all_family_members(db, family_group_id)


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
    return await profile_service.update_member_profile(
        db, member_id, data, current_member.id, family_group_id
    )
