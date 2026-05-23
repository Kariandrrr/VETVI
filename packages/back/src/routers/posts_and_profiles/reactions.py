from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.schemas.reactions import ReactionCreate, ReactionRead
from ...deps.family import get_current_member_in_family
from ...deps.user import get_db, get_current_user
from ...service.media_and_profiles import reactions as reaction_service

router = APIRouter()


@router.post(
    "/families/{family_group_id}/posts/{post_id}/reactions", response_model=ReactionRead
)
async def toggle_reaction(
    family_group_id: UUID,
    post_id: UUID,
    reaction: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    current_member=Depends(get_current_member_in_family),
):
    return await reaction_service.toggle_reaction(
        db,
        post_id,
        current_member.id,
        current_user.id,
        family_group_id,
        reaction.reaction_type,
    )


@router.get("/families/{family_group_id}/posts/{post_id}/reactions")
async def get_post_reactions(
    family_group_id: UUID,
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await reaction_service.get_post_reactions_summary(
        db, post_id, family_group_id, current_user.id
    )


@router.get("/families/{family_group_id}/posts/{post_id}/my-reaction")
async def get_my_reaction(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    current_member=Depends(get_current_member_in_family),
):
    reaction = await reaction_service.get_my_reaction(
        db, post_id, current_member.id, current_user.id
    )

    return {
        "post_id": post_id,
        "member_id": current_member.id,
        "reaction_type": reaction.value if reaction else None,
    }
