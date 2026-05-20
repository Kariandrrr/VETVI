from uuid import UUID

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.models.enums import MembershipRole
from ..core.models.families import FamilyGroup, FamilyMembership
from ..core.models.members import FamilyMember
from ..core.models.users import User
from ..core.schemas.family_group import FamilyGroupCreate, FamilyGroupUpdate


async def create_family_group(
    db: AsyncSession, group_in: FamilyGroupCreate, owner_id: UUID
) -> FamilyGroup:
    db_group = FamilyGroup(
        name=group_in.name,
        description=group_in.description,
        created_by=owner_id,
    )
    db.add(db_group)
    await db.flush()

    membership = FamilyMembership(
        user_id=owner_id,
        family_group_id=db_group.id,
        role=MembershipRole.admin,
        is_favourite=True,
    )
    db.add(membership)

    user_result = await db.execute(select(User).where(User.id == owner_id))
    user = user_result.scalar_one()

    new_member = FamilyMember(
        family_group_id=db_group.id,
        linked_user_id=owner_id,
        first_name=user.display_name or user.email.split("@")[0],
        last_name="",
        created_by=owner_id,
        is_alive=True,
    )
    db.add(new_member)

    await db.commit()
    await db.refresh(db_group)
    return db_group


async def get_single_family_by_id(
    db: AsyncSession, family_id: UUID
) -> FamilyGroup | None:
    result = await db.execute(select(FamilyGroup).where(FamilyGroup.id == family_id))
    return result.scalar_one_or_none()


async def get_user_family_list(db: AsyncSession, user_id: UUID) -> list[FamilyGroup]:
    result = await db.execute(
        select(FamilyGroup)
        .join(FamilyMembership, FamilyGroup.id == FamilyMembership.family_group_id)
        .where(FamilyMembership.user_id == user_id)
        .options(selectinload(FamilyGroup.memberships))
    )
    return list(result.scalars().unique().all())


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
):
    stmt = delete(FamilyMembership).where(
        and_(
            FamilyMembership.user_id == user_id,
            FamilyMembership.family_group_id == family_group_id,
        )
    )

    await db.execute(stmt)
    await db.commit()


async def delete_family_group(
    db: AsyncSession,
    family_group_id: UUID,
) -> None:
    await db.execute(
        delete(FamilyMembership).where(
            FamilyMembership.family_group_id == family_group_id
        )
    )
    await db.execute(delete(FamilyGroup).where(FamilyGroup.id == family_group_id))
    await db.commit()
