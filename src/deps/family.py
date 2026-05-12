from uuid import UUID

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models import User, FamilyMember
from ..core.models.enums import MembershipRole
from ..core.models.families import FamilyMembership
from ..deps.user import get_current_user, get_db


async def if_family_member(
    db: AsyncSession,
    user_id: UUID,
    family_group_id: UUID,
) -> bool:
    stmt = select(FamilyMembership).where(
        and_(
            FamilyMembership.user_id == user_id,
            FamilyMembership.family_group_id == family_group_id,
        )
    )
    member = await db.scalar(stmt)
    if not member:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to see the content of this family group",
        )
    return member


async def get_current_member_in_family(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> FamilyMember:
    family_group_id = request.path_params.get("family_group_id")

    if not family_group_id:
        raise HTTPException(
            status_code=400, detail="family_group_id is required in path"
        )

    try:
        family_group_id = UUID(family_group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid family_group_id")

    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == current_user.id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(
            status_code=403,
            detail=f"You are not a member of this family group (ID: {family_group_id})",
        )

    return member


async def get_user_role_in_family(
    db: AsyncSession,
    user_id: UUID,
    family_group_id: UUID,
) -> MembershipRole | None:
    stmt = select(FamilyMembership.role).where(
        and_(
            FamilyMembership.user_id == user_id,
            FamilyMembership.family_group_id == family_group_id,
        )
    )
    result = await db.execute(stmt)
    return result.scalar()


class RoleChecker:
    def __init__(self, allowed_roles: list[MembershipRole]) -> None:
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        family_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        role = await get_user_role_in_family(db, current_user.id, family_id)
        if role is None:
            raise HTTPException(
                status_code=403, detail="You are not in this family group"
            )

        if role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")

        return role


async def check_post_access(
    db: AsyncSession,
    post_user_id: UUID,
    viewer_user_id: UUID,
) -> bool:
    from sqlalchemy import select

    stmt = select(FamilyMember.family_group_id).where(
        FamilyMember.linked_user_id == post_user_id
    )
    result = await db.execute(stmt)
    post_family_ids = {row[0] for row in result.all()}

    stmt = select(FamilyMember.family_group_id).where(
        FamilyMember.linked_user_id == viewer_user_id
    )
    result = await db.execute(stmt)
    viewer_family_ids = {row[0] for row in result.all()}

    return bool(post_family_ids & viewer_family_ids)
