from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.models.content import Post
from ...core.models.members import FamilyMember
from ...core.schemas.post import PostCreate, PostUpdate, PostRead


async def create_post(
    db: AsyncSession,
    post_in: PostCreate,
    user_id: UUID,
) -> Post:
    post = Post(user_id=user_id, **post_in.model_dump(exclude_unset=True))
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def get_user_posts(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
) -> List[PostRead]:
    query = (
        select(Post)
        .options(
            selectinload(Post.media),
            selectinload(Post.tags),
            selectinload(Post.reactions),
        )
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    posts = await db.execute(query)
    posts = posts.scalars().all()

    return [PostRead.model_validate(p) for p in posts]


async def get_family_feed(
    db: AsyncSession,
    family_group_id: UUID,
    viewer_user_id: UUID,
    skip: int = 0,
    limit: int = 20,
) -> List[PostRead]:

    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == viewer_user_id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    if not result.scalar():
        raise HTTPException(
            status_code=403, detail="You are not a member of this family"
        )

    stmt = select(FamilyMember.linked_user_id).where(
        FamilyMember.family_group_id == family_group_id
    )
    result = await db.execute(stmt)
    member_user_ids = [row[0] for row in result.all()]

    if not member_user_ids:
        return []

    query = (
        select(Post)
        .options(
            selectinload(Post.media),
            selectinload(Post.tags),
            selectinload(Post.reactions),
        )
        .where(Post.user_id.in_(member_user_ids))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    posts = await db.execute(query)
    posts = posts.scalars().all()

    return [PostRead.model_validate(p) for p in posts]


async def get_post_by_id(
    db: AsyncSession,
    post_id: UUID,
) -> Post:
    stmt = (
        select(Post)
        .options(
            selectinload(Post.media),
            selectinload(Post.tags),
            selectinload(Post.reactions),
        )
        .where(Post.id == post_id)
    )
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post


async def update_post(
    db: AsyncSession,
    post_id: UUID,
    post_in: PostUpdate,
    requester_user_id: UUID,
) -> PostRead:
    stmt = select(Post).where(Post.id == post_id, Post.user_id == requester_user_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found or not yours")

    update_data = post_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(post, key, value)

    post.updated_at = datetime.now()

    await db.commit()
    await db.refresh(post)

    stmt = (
        select(Post)
        .options(
            selectinload(Post.media),
            selectinload(Post.tags),
            selectinload(Post.reactions),
        )
        .where(Post.id == post_id)
    )
    result = await db.execute(stmt)
    post = result.scalar()

    return PostRead.model_validate(post)


async def delete_post(
    db: AsyncSession,
    post_id: UUID,
    requester_user_id: UUID,
) -> None:
    stmt = select(Post).where(Post.id == post_id, Post.user_id == requester_user_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found or not yours")

    await db.delete(post)
    await db.commit()
