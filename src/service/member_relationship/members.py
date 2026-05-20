from datetime import date
from uuid import UUID

from sqlalchemy import select, and_, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.models.enums import RelationshipType
from src.core.models.members import FamilyMember, Relationship
from src.core.schemas.family_members import FamilyMemberCreate, FamilyMemberUpdate


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


async def get_members_by_family_id(
    db: AsyncSession,
    family_group_id: UUID,
):
    result = await db.execute(
        select(FamilyMember).where(
            FamilyMember.family_group_id == family_group_id,
        )
    )
    return result.scalars().all()


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
