from uuid import UUID

from fastapi import Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models.enums import MembershipRole
from ..core.models.families import FamilyMembership
from ..deps.user import get_current_user


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
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


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
        current_user: Depends(get_current_user),
        db: AsyncSession,
    ):
        role = await get_user_role_in_family(db, current_user.id, family_id)
        if role is None:
            raise HTTPException(
                status_code=403, detail="You are not in this family group"
            )

        if role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")

        return role
