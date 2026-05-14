from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.models.content import Post
from ...core.models.members import FamilyMember
from ...core.schemas.post import PostCreate, PostUpdate, PostRead
from ...core.schemas.reactions import ReactionSummary
from ...core.schemas.user import UserRead


def _post_to_read(post: Post) -> PostRead:
    reactions_count = {}
    for reaction in post.reactions:
        reaction_type = reaction.reaction_type
        reactions_count[reaction_type] = reactions_count.get(reaction_type, 0) + 1

    reaction_summaries = [
        ReactionSummary(reaction_type=rt, count=count)
        for rt, count in reactions_count.items()
    ]

    author_data = None
    if post.author:
        author_data = UserRead(
            id=post.author.id,
            email=post.author.email,
            display_name=post.author.display_name,
            avatar_url=post.author.avatar_url,
            role=post.author.role,
            created_at=post.author.created_at,
        )

    return PostRead(
        id=post.id,
        author_id=post.author_id,
        attributed_to_member_id=post.attributed_to_member_id,
        post_type=post.post_type,
        title=post.title,
        body=post.body,
        created_at=post.created_at,
        updated_at=post.updated_at,
        media=post.media or [],
        tags=post.tags or [],
        reactions=reaction_summaries,
        author=author_data,
    )


async def create_post(
    db: AsyncSession,
    post_in: PostCreate,
    author_id: UUID,
) -> Post:
    post = Post(author_id=author_id, **post_in.model_dump(exclude_unset=True))
    db.add(post)
    await db.commit()
    await db.refresh(post)

    stmt = (
        select(Post)
        .options(
            selectinload(Post.media),
            selectinload(Post.tags),
            selectinload(Post.reactions),
            selectinload(Post.author),
        )
        .where(Post.id == post.id)
    )
    result = await db.execute(stmt)
    post_with_relations = result.scalar()

    return post_with_relations


async def get_user_posts(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
) -> list[PostRead]:
    query = (
        select(Post)
        .options(
            selectinload(Post.media),
            selectinload(Post.tags),
            selectinload(Post.reactions),
            selectinload(Post.author),
        )
        .where(Post.author_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    posts = result.scalars().all()

    return [_post_to_read(post) for post in posts]


async def get_family_feed(
    db: AsyncSession,
    family_group_id: UUID,
    viewer_user_id: UUID,
    skip: int = 0,
    limit: int = 20,
) -> list[PostRead]:
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
        FamilyMember.family_group_id == family_group_id,
        FamilyMember.linked_user_id.isnot(None),
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
            selectinload(Post.author),
        )
        .where(Post.author_id.in_(member_user_ids))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    posts = result.scalars().all()

    return [_post_to_read(post) for post in posts]


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
            selectinload(Post.author),
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
    stmt = select(Post).where(Post.id == post_id, Post.author_id == requester_user_id)
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
            selectinload(Post.author),
        )
        .where(Post.id == post_id)
    )
    result = await db.execute(stmt)
    post_with_relations = result.scalar()

    return _post_to_read(post_with_relations)


async def delete_post(
    db: AsyncSession,
    post_id: UUID,
    requester_user_id: UUID,
) -> None:
    stmt = select(Post).where(Post.id == post_id, Post.author_id == requester_user_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found or not yours")

    await db.delete(post)
    await db.commit()
