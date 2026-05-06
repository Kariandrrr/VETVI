from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.models import User
from src.core.models.enums import MembershipRole
from src.core.schemas.relationship import (
    RelationshipCreate,
    RelationshipRead,
    RelationshipUpdate,
)
from src.crud import members as member_service
from src.deps.family import RoleChecker
from src.deps.user import get_db, get_current_user

router = APIRouter()


@router.post("/relationships", response_model=RelationshipRead, status_code=201)
async def create_relationship(
    relationship_in: RelationshipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await RoleChecker([MembershipRole.admin, MembershipRole.editor])(
        family_id=relationship_in.family_group_id,
        current_user=current_user,
        db=db,
    )
    try:
        relationship = await member_service.create_relationship(
            db, relationship_in, current_user.id
        )
        return relationship
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/relationships/{relationship_id}", response_model=RelationshipRead)
async def get_relationship(
    relationship_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    relationship = await member_service.get_relationship_by_id(db, relationship_id)
    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")

    await RoleChecker(
        [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
    )(
        family_id=relationship.family_group_id,
        current_user=current_user,
        db=db,
    )
    return relationship


@router.put("/relationships/{relationship_id}", response_model=RelationshipRead)
async def update_relationship(
    relationship_id: UUID,
    relationship_in: RelationshipUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_relationship = await member_service.get_relationship_by_id(db, relationship_id)
    if not db_relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")

    await RoleChecker([MembershipRole.admin, MembershipRole.editor])(
        family_id=db_relationship.family_group_id,
        current_user=current_user,
        db=db,
    )

    try:
        relationship = await member_service.update_relationship(
            db, db_relationship, relationship_in
        )
        return relationship
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/relationships/{relationship_id}", status_code=204)
async def delete_relationship(
    relationship_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_relationship = await member_service.get_relationship_by_id(db, relationship_id)
    if not db_relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")

    await RoleChecker([MembershipRole.admin])(
        family_id=db_relationship.family_group_id,
        current_user=current_user,
        db=db,
    )

    await member_service.delete_relationship(db, relationship_id)
    return {"message": "Relationship deleted"}


@router.get(
    "/groups/{family_id}/members/{member_id}/relationships",
    response_model=list[RelationshipRead],
)
async def get_members_relationships(
    family_id: UUID,
    member_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await RoleChecker(
        [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
    )(
        family_id=family_id,
        current_user=current_user,
        db=db,
    )
    db_member = await member_service.get_family_member_in_group(
        db, family_id, member_id
    )
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")

    relationship = member_service.get_members_relationships(db, family_id, member_id)
    return relationship


@router.get("/groups/{family_id}/relationships", response_model=list[RelationshipRead])
async def get_all_group_relationships(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await RoleChecker(
        [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
    )(
        family_id=family_id,
        current_user=current_user,
        db=db,
    )
    relationships = await member_service.get_all_relationships(db, family_id)
    return relationships
