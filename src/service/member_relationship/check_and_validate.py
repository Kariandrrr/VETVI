from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.models.enums import RelationshipType
from src.core.models.members import FamilyMember, Relationship

if TYPE_CHECKING:
    from .members import get_all_ancestors


async def check_member_uniqueness_in_group(
    db: AsyncSession,
    family_group_id: UUID,
    first_name: str,
    last_name: str,
    birth_date: date | None = None,
    exclude_member_id: UUID = None,
) -> bool:
    conditions = [
        FamilyMember.family_group_id == family_group_id,
        func.lower(FamilyMember.first_name) == func.lower(first_name),
        func.lower(FamilyMember.last_name) == func.lower(last_name),
    ]

    if birth_date:
        conditions.append(FamilyMember.birth_date == birth_date)

    if exclude_member_id:
        conditions.append(FamilyMember.id != exclude_member_id)

    stmt = select(FamilyMember).where(and_(*conditions))
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    return existing is not None


async def check_relationship_exists(
    db: AsyncSession,
    family_group_id: UUID,
    from_member_id: UUID,
    to_member_id: UUID,
    rel_type: RelationshipType,
    exclude_rel_id: UUID | None = None,
) -> Relationship | None:
    conditions = [
        Relationship.family_group_id == family_group_id,
        Relationship.from_member_id == from_member_id,
        Relationship.to_member_id == to_member_id,
        Relationship.rel_type == rel_type,
    ]

    if exclude_rel_id:
        conditions.append(Relationship.id != exclude_rel_id)

    stmt = select(Relationship).where(and_(*conditions))
    result = await db.execute(stmt)

    return result.scalar_one_or_none() is not None


async def validate_parent_child_relationship(
    db: AsyncSession,
    family_group_id: UUID,
    parent_id: UUID,
    child_id: UUID,
    exclude_rel_id: UUID | None = None,
) -> tuple[bool, str | None]:

    if parent_id == child_id:
        return False, "Parent and child cannot be the same person"

    stmt = select(Relationship).where(
        and_(
            Relationship.family_group_id == family_group_id,
            Relationship.to_member_id == child_id,
            Relationship.rel_type == RelationshipType.parent_child,
        )
    )
    if exclude_rel_id:
        stmt = stmt.where(Relationship.id != exclude_rel_id)

    result = await db.execute(stmt)
    existing_parent = result.scalars().all()

    if len(existing_parent) >= 2:
        return False, "Child still has two parents"

    ancestor_ids = await get_all_ancestors(db, family_group_id, parent_id)
    if child_id in ancestor_ids:
        return False, "Impossible to create a cycle"

    return True, None


async def validate_spouse_relationship(
    db: AsyncSession,
    family_group_id: UUID,
    spouse1_id: UUID,
    spouse2_id: UUID,
    exclude_rel_id: UUID | None = None,
) -> tuple[bool, str | None]:
    stmt = select(Relationship).where(
        and_(
            Relationship.family_group_id == family_group_id,
            Relationship.divorce_date.is_(None),
            Relationship.rel_type == RelationshipType.spouse,
        )
    )
    if exclude_rel_id:
        stmt = stmt.where(Relationship.id != exclude_rel_id)

    result = await db.execute(stmt)
    existing_relationship = result.scalars().all()

    for rel in existing_relationship:
        if rel.from_member_id in (spouse1_id, spouse2_id) or rel.to_member_id in (
            spouse1_id,
            spouse2_id,
        ):
            return False, "One of spouses has active marriage"

    ancestors1 = await get_all_ancestors(db, family_group_id, spouse1_id)
    ancestors2 = await get_all_ancestors(db, family_group_id, spouse2_id)

    if spouse2_id in ancestors1 or spouse1_id in ancestors2:
        return False, "Impossible to make a marriage"

    stmt = select(Relationship.from_member_id).where(
        and_(
            Relationship.family_group_id == family_group_id,
            Relationship.to_member_id == spouse1_id,
            Relationship.rel_type == RelationshipType.parent_child,
        )
    )
    result = await db.execute(stmt)
    parents1 = set(result.scalars().all())

    result = await db.execute(stmt)
    parents2 = set(result.scalars().all())

    if parents1 & parents2:
        return False, "Impossible to make a marriage"

    return True, None
