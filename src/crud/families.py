from uuid import UUID

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models.enums import MembershipRole
from ..core.models.families import FamilyGroup, FamilyMembership
from ..core.schemas.family_group import FamilyGroupCreate, FamilyGroupUpdate


async def create_family_group(
    db: AsyncSession, group_in: FamilyGroupCreate, owner_id: UUID
) -> FamilyGroup:
    db_group = FamilyGroup(
        name=group_in.name,
        description=group_in.description,
        created_by=owner_id,
    )
    await db.flush()

    membership = FamilyMembership(
        user_id=owner_id, family_group_id=db_group.id, role=MembershipRole.admin
    )
    db.add(membership)

    await db.commit()
    await db.refresh(db_group)
    return db_group


async def get_family_group(db: AsyncSession, user_id: UUID) -> FamilyGroup:
    result = await db.execute(
        select(FamilyGroup)
        .join(FamilyMembership)
        .where(FamilyMembership.user_id == user_id)
    )
    return result.scalars().all()


async def update_family_group(
    db: AsyncSession,
    db_group: FamilyGroup,
    obj_in: FamilyGroupUpdate,
) -> FamilyGroup | None:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_group, field, update_data[field])

        db.add(db_group)
        await db.commit()
        await db.refresh(db_group)
        return db_group


async def update_member_role(
    db: AsyncSession,
    family_group_id: UUID,
    user_id: UUID,
    new_role: MembershipRole,
) -> bool:
    stmt = select(FamilyMembership).where(
        and_(
            FamilyMembership.user_id == user_id,
            FamilyMembership.family_group_id == family_group_id,
        )
    )
    result = await db.execute(stmt)
    membership = result.scalar_one_or_none()

    if membership:
        membership.role = new_role
        await db.commit()
        return True
    return False


async def remove_member_from_family(
    db: AsyncSession,
    family_group_id: UUID,
    user_id: UUID,
) -> None:
    stmt = delete(FamilyMembership).where(
        and_(
            FamilyMembership.user_id == user_id,
            FamilyMembership.family_group_id == family_group_id,
        )
    )

    await db.execute(stmt)
    await db.commit()
    return None


async def delete_family_group(
    db: AsyncSession,
    family_group_id: UUID,
) -> None:
    stmt = delete(FamilyGroup).where(FamilyGroup.id == family_group_id)
    await db.execute(stmt)
    await db.commit()
