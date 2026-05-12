from typing import Optional, Dict, Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.models.content import Post, PostReaction
from ...core.models.members import FamilyMember
from ...core.schemas.reactions import ReactionType, ReactionRead


async def toggle_reaction(
    db: AsyncSession,
    post_id: UUID,
    member_id: UUID,
    user_id: UUID,
    family_group_id: UUID,
    reaction_type: ReactionType,
) -> ReactionRead:
    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id,
        FamilyMember.linked_user_id == user_id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(
            status_code=403, detail="Invalid member profile for this family"
        )

    stmt = select(Post).where(Post.id == post_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == user_id,
        FamilyMember.family_group_id.in_(
            select(FamilyMember.family_group_id).where(
                FamilyMember.linked_user_id == post.user_id
            )
        ),
    )
    result = await db.execute(stmt)
    if not result.scalar():
        raise HTTPException(
            status_code=403, detail="You don't have access to this post"
        )

    stmt = select(PostReaction).where(
        PostReaction.post_id == post_id, PostReaction.member_id == member_id
    )
    result = await db.execute(stmt)
    existing = result.scalar()

    if existing:
        if existing.reaction_type == reaction_type.value:
            await db.delete(existing)
            await db.commit()
            return ReactionRead(
                post_id=post_id,
                member_id=member_id,
                reaction_type=None,
                action="removed",
            )
        else:
            existing.reaction_type = reaction_type.value
            await db.commit()
            await db.refresh(existing)
            return ReactionRead(
                post_id=post_id,
                member_id=member_id,
                reaction_type=reaction_type,
                action="updated",
            )
    else:
        reaction = PostReaction(
            post_id=post_id, member_id=member_id, reaction_type=reaction_type.value
        )
        db.add(reaction)
        await db.commit()
        await db.refresh(reaction)
        return ReactionRead(
            post_id=post_id,
            member_id=member_id,
            reaction_type=reaction_type,
            action="added",
        )


async def get_post_reactions_summary(
    db: AsyncSession,
    post_id: UUID,
    family_group_id: UUID,
    user_id: UUID,
) -> Dict[str, Any]:
    stmt = select(Post).where(Post.id == post_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == user_id,
        FamilyMember.family_group_id.in_(
            select(FamilyMember.family_group_id).where(
                FamilyMember.linked_user_id == post.user_id
            )
        ),
    )
    result = await db.execute(stmt)
    if not result.scalar():
        raise HTTPException(
            status_code=403, detail="You don't have access to this post"
        )

    stmt = (
        select(PostReaction.reaction_type, func.count(PostReaction.id).label("count"))
        .join(FamilyMember, FamilyMember.id == PostReaction.member_id)
        .where(
            PostReaction.post_id == post_id,
            FamilyMember.family_group_id == family_group_id,
        )
        .group_by(PostReaction.reaction_type)
    )

    result = await db.execute(stmt)
    reactions_data = result.all()

    summary = {row.reaction_type: row.count for row in reactions_data}

    return {"post_id": post_id, "reactions": summary, "total": sum(summary.values())}


async def get_my_reaction(
    db: AsyncSession,
    post_id: UUID,
    member_id: UUID,
    user_id: UUID,
) -> Optional[ReactionType]:

    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id, FamilyMember.linked_user_id == user_id
    )
    result = await db.execute(stmt)
    if not result.scalar():
        raise HTTPException(status_code=403, detail="Invalid member profile")

    stmt = select(PostReaction).where(
        PostReaction.post_id == post_id, PostReaction.member_id == member_id
    )
    result = await db.execute(stmt)
    reaction = result.scalar()

    if reaction:
        return ReactionType(reaction.reaction_type)
    return None
