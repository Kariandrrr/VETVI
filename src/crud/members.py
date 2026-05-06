from datetime import date
from uuid import UUID

from sqlalchemy import select, and_, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.models.enums import RelationshipType
from ..core.models.members import FamilyMember, Relationship
from ..core.schemas.family_members import FamilyMemberCreate, FamilyMemberUpdate
from ..core.schemas.relationship import RelationshipCreate, RelationshipUpdate


async def get_family_member_by_id(
    db: AsyncSession, member_id: UUID
) -> FamilyMember | None:
    result = await db.execute(select(FamilyMember).where(FamilyMember.id == member_id))
    return result.scalar_one_or_none()


async def get_family_member_in_group(
    db: AsyncSession, family_group_id: UUID, member_id: UUID
) -> FamilyMember | None:
    result = await db.execute(
        select(FamilyMember).where(
            and_(
                FamilyMember.id == member_id,
                FamilyMember.family_group_id == family_group_id,
            )
        )
    )
    return result.scalar_one_or_none()


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


async def create_family_member(
    db: AsyncSession,
    member_in: FamilyMemberCreate,
    created_by: UUID,
) -> FamilyMember:
    is_duplicate = await check_member_uniqueness_in_group(
        db=db,
        family_group_id=member_in.family_group_id,
        first_name=member_in.first_name,
        last_name=member_in.last_name or "",
        birth_date=member_in.birth_date,
    )

    if is_duplicate:
        raise ValueError(f"Family Member with this name and birth date already exists")

    db_member = FamilyMember(
        family_group_id=member_in.family_group_id,
        linked_user_id=member_in.linked_user_id,
        first_name=member_in.first_name,
        last_name=member_in.last_name,
        patronymic=member_in.patronymic,
        maiden_name=member_in.maiden_name,
        gender=member_in.gender,
        birth_date=member_in.birth_date,
        birth_place=member_in.birth_place,
        death_date=member_in.death_date,
        death_place=member_in.death_place,
        is_alive=member_in.is_alive,
        bio=member_in.bio,
        avatar_url=member_in.avatar_url,
        created_by=created_by,
    )

    db.add(db_member)
    await db.commit()
    await db.refresh(db_member)
    return db_member


async def update_family_member(
    db: AsyncSession,
    db_member: FamilyMember,
    obj_in: FamilyMemberUpdate,
) -> FamilyMember:
    update_data = obj_in.model_dump(exclude_unset=True)

    if any(key in update_data for key in ["first_name", "last_name", "birth_date"]):
        first_name = update_data.get("first_name", db_member.first_name)
        last_name = update_data.get("last_name", db_member.last_name) or ""
        birth_date = update_data.get("birth_date", db_member.birth_date)

        is_duplicate = await check_member_uniqueness_in_group(
            db=db,
            family_group_id=db_member.family_group_id,
            first_name=first_name,
            last_name=last_name,
            birth_date=birth_date,
            exclude_member_id=db_member.id,
        )
        if is_duplicate:
            raise ValueError(
                "Family Member with these last name and birth date already exists"
            )

    for field, value in update_data.items():
        setattr(db_member, field, value)

    db.add(db_member)
    await db.commit()
    await db.refresh(db_member)
    return db_member


async def delete_family_member(
    db: AsyncSession,
    member_id: UUID,
) -> None:
    await db.execute(delete(FamilyMember).where(FamilyMember.id == member_id))
    await db.commit()


async def get_relationship_by_id(
    db: AsyncSession,
    relationship_id: UUID,
) -> Relationship | None:
    result = await db.execute(
        select(Relationship).where(Relationship.id == relationship_id)
    )
    return result.scalar_one_or_none()


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


async def get_all_ancestors(
    db: AsyncSession,
    family_group_id: UUID,
    member_id: UUID,
) -> set[UUID]:
    ancestors = set()
    queue = [member_id]

    while queue:
        current_id = queue.pop(0)
        stmt = select(Relationship.from_member_id).where(
            and_(
                Relationship.family_group_id == family_group_id,
                Relationship.to_member_id == current_id,
                Relationship.rel_type == RelationshipType.parent_child,
            )
        )
        result = await db.execute(stmt)
        parents = result.scalars().all()

        for parent_id in parents:
            if parent_id not in ancestors:
                ancestors.add(parent_id)
                queue.append(parent_id)

    return ancestors


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
