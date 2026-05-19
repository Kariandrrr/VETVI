from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.models import User, FamilyMember
from ...core.schemas.post import PostRead, PostCreate, PostUpdate
from ...deps.family import get_current_member_in_family
from ...deps.user import get_db, get_current_user
from ...service.media_and_profiles import posts as post_service

router = APIRouter()


@router.post("/posts", response_model=PostRead, status_code=201)
async def create_post(
    post_in: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_member: FamilyMember = Depends(get_current_member_in_family),
):
    return await post_service.create_post(
        db, post_in, current_user.id, current_member.family_group_id)


@router.get("/users/{user_id}/posts", response_model=List[PostRead])
async def get_user_posts(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await post_service.get_user_posts(db, user_id, skip, limit)


@router.get("/families/{family_group_id}/feed", response_model=List[PostRead])
async def get_family_feed(
    family_group_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await post_service.get_family_feed(
        db, family_group_id, current_user.id, skip, limit
    )


@router.get("/posts/{post_id}", response_model=PostRead)
async def get_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await post_service.get_post_by_id(db, post_id)


@router.put("/posts/{post_id}", response_model=PostRead)
async def update_post(
    post_id: UUID,
    post_in: PostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await post_service.update_post(db, post_id, post_in, current_user.id)


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await post_service.delete_post(db, post_id, current_user.id)
    return None
