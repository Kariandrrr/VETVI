from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.models.content import Tag, Post
from ...core.schemas.media_tags import TagRead, TagUpdate


async def create_tag(db: AsyncSession, family_group_id: UUID, name: str) -> TagRead:
    # Исправлен синтаксис (убраны квадратные скобки)
    stmt = select(Tag).where(Tag.family_group_id == family_group_id, Tag.name == name)
    result = await db.execute(stmt)

    if result.scalar():
        raise HTTPException(status_code=400, detail="Tag already exists")

    tag = Tag(family_group_id=family_group_id, name=name)

    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return TagRead.model_validate(tag)


async def get_family_tags_list(
    db: AsyncSession,
    family_group_id: UUID,
) -> list[TagRead]:
    stmt = select(Tag).where(Tag.family_group_id == family_group_id)
    result = await db.execute(stmt)

    return [TagRead.model_validate(t) for t in result.scalars().all()]


async def update_tag(
    db: AsyncSession,
    tag_id: UUID,
    family_group_id: UUID,
    data: TagUpdate,
) -> TagRead:
    stmt = select(Tag).where(Tag.id == tag_id, Tag.family_group_id == family_group_id)

    result = await db.execute(stmt)
    tag = result.scalar()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tag, key, value)

    await db.commit()
    await db.refresh(tag)
    return TagRead.model_validate(tag)


async def attach_tags_to_post(
    db: AsyncSession,
    post_id: UUID,
    tag_ids: List[UUID],
    family_group_id: UUID,
) -> Post:
    stmt = select(Post).options(selectinload(Post.tags)).where(Post.id == post_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    stmt = select(Tag).where(
        Tag.id.in_(tag_ids), Tag.family_group_id == family_group_id
    )
    result = await db.execute(stmt)
    tags = result.scalars().all()

    if len(tags) != len(tag_ids):
        raise HTTPException(status_code=400, detail="One or more tags not found")

    post.tags = tags

    await db.commit()
    await db.refresh(post)
    return post
