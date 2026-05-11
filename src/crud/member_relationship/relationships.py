from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.models.enums import RelationshipType
from src.core.models.members import FamilyMember, Relationship
from src.core.schemas.relationship import RelationshipCreate, RelationshipUpdate

if TYPE_CHECKING:
    from .check_and_validate import (
        check_relationship_exists,
        validate_spouse_relationship,
        validate_parent_child_relationship,
    )
    from .members import get_family_member_by_id


async def create_relationship(
    db: AsyncSession,
    relationship_in: RelationshipCreate,
    created_by: UUID,
) -> Relationship:
    from_member = await get_family_member_by_id(db, relationship_in.from_member_id)
    to_member = await get_family_member_by_id(db, relationship_in.to_member_id)

    if not from_member or not to_member:
        raise ValueError("One or two members do not exist")

    if (
        from_member.family_group_id != relationship_in.family_group_id
        or to_member.family_group_id != relationship_in.family_group_id
    ):
        raise ValueError("Members must relate to one family group")

    exists = await check_relationship_exists(
        db=db,
        family_group_id=relationship_in.family_group_id,
        from_member_id=relationship_in.from_member_id,
        to_member_id=relationship_in.to_member_id,
        rel_type=relationship_in.rel_type,
    )

    if exists:
        raise ValueError("Такая связь уже существует")

    if relationship_in.rel_type == RelationshipType.parent_child:
        is_valid, error_msg = await validate_parent_child_relationship(
            db=db,
            family_group_id=relationship_in.family_group_id,
            parent_id=relationship_in.from_member_id,
            child_id=relationship_in.to_member_id,
        )
        if not is_valid:
            raise ValueError(error_msg)

    elif relationship_in.rel_type == RelationshipType.spouse:
        is_valid, error_msg = await validate_spouse_relationship(
            db=db,
            family_group_id=relationship_in.family_group_id,
            spouse1_id=relationship_in.from_member_id,
            spouse2_id=relationship_in.to_member_id,
        )
        if not is_valid:
            raise ValueError(error_msg)

    db_relationship = Relationship(
        family_group_id=relationship_in.family_group_id,
        from_member_id=relationship_in.from_member_id,
        to_member_id=relationship_in.to_member_id,
        rel_type=relationship_in.rel_type,
        marriage_date=relationship_in.marriage_date,
        divorce_date=relationship_in.divorce_date,
        created_by=created_by,
    )

    db.add(db_relationship)
    await db.commit()
    await db.refresh(db_relationship)
    return db_relationship


async def update_relationship(
    db: AsyncSession,
    db_relationship: Relationship,
    obj_in: RelationshipUpdate,
) -> Relationship:
    update_data = obj_in.model_dump(exclude_unset=True)

    if "divorce_date" in update_data and update_data["divorce_date"]:
        marriage_date = db_relationship.marriage_date
        divorce_date = update_data["divorce_date"]

        if marriage_date and divorce_date <= marriage_date:
            raise ValueError("The divorce date must be later than the marriage date")

    for field, value in update_data.items():
        setattr(db_relationship, field, value)

    db.add(db_relationship)
    await db.commit()
    await db.refresh(db_relationship)
    return db_relationship


async def delete_relationship(
    db: AsyncSession,
    relationship_id: UUID,
) -> None:
    await db.execute(delete(Relationship).where(Relationship.id == relationship_id))
    await db.commit()


async def get_members_relationships(
    db: AsyncSession,
    family_group_id: UUID,
    member_id: UUID,
) -> list[Relationship]:
    result = await db.execute(
        select(Relationship)
        .options(selectinload(Relationship.group))
        .where(
            and_(
                Relationship.family_group_id == family_group_id,
                and_(
                    Relationship.from_member_id == member_id,
                    Relationship.to_member_id == member_id,
                ),
            )
        )
    )
    return list(result.scalars().all())


async def get_all_relationships(
    db: AsyncSession,
    family_group_id: UUID,
) -> list[Relationship]:
    result = await db.execute(
        select(Relationship)
        .options(selectinload(Relationship.group))
        .where(Relationship.family_group_id == family_group_id)
    )
    return list(result.scalars().all())


async def get_member_by_linked_user(
    db: AsyncSession,
    family_group_id: UUID,
    user_id: UUID,
) -> FamilyMember | None:
    stmt = select(FamilyMember).where(
        FamilyMember.family_group_id == family_group_id,
        FamilyMember.linked_user_id == user_id,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
