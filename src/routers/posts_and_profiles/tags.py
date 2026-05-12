from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.models import Post
from ...core.models.enums import MembershipRole
from ...core.models.members import FamilyMember
from ...core.schemas.media_tags import TagRead, TagCreate, TagUpdate
from ...deps.family import RoleChecker
from ...deps.user import get_db, get_current_user
from ...service.media_and_profiles import tags as tag_service

router = APIRouter()


@router.post(
    "/families/{family_group_id}/tags", response_model=TagRead, status_code=201
)
async def create_tag(
    family_group_id: UUID,
    tag_in: TagCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(RoleChecker([MembershipRole.admin, MembershipRole.editor])),
):
    return await tag_service.create_tag(db, family_group_id, tag_in.name)


@router.get("/families/{family_group_id}/tags", response_model=List[TagRead])
async def get_family_tags(
    family_group_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    return await tag_service.get_family_tags_list(db, family_group_id)


@router.put("/families/{family_group_id}/tags/{tag_id}", response_model=TagRead)
async def update_tag(
    family_group_id: UUID,
    tag_id: UUID,
    tag_in: TagUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(RoleChecker([MembershipRole.admin, MembershipRole.editor])),
):
    return await tag_service.update_tag(db, tag_id, family_group_id, tag_in)


@router.post("/families/{family_group_id}/posts/{post_id}/tags")
async def attach_tags_to_post(
    family_group_id: UUID,
    post_id: UUID,
    tag_ids: List[UUID],
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):

    stmt = select(Post).where(Post.id == post_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != current_user.id:
        stmt = select(FamilyMember).where(
            FamilyMember.linked_user_id == current_user.id,
            FamilyMember.family_group_id == family_group_id,
        )
        result = await db.execute(stmt)
        if not result.scalar():
            raise HTTPException(
                status_code=403,
                detail="Only author or admin can attach tags to this post",
            )

    return await tag_service.attach_tags_to_post(db, post_id, tag_ids, family_group_id)
