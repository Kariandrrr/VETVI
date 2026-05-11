from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.models import User
from ...core.models.enums import MembershipRole
from ...core.schemas.post import PostRead, PostCreate, PostUpdate
from ...deps.family import RoleChecker
from ...deps.user import get_db, get_current_user
from ...service.media_and_profiles import posts as post_service

router = APIRouter()


@router.post("/", response_model=PostRead, status_code=201)
async def create_new_post(
    post_in: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    return post_service.create_post(db, post_in, current_user.id)


@router.get("/family/{family_id}", response_model=list[PostRead])
async def read_family_posts(
    family_group_id: UUID,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    return post_service.get_family_posts(db, family_group_id, skip, limit)


@router.put("/{post_id}", response_model=PostRead)
async def update_post(
    post_id: UUID,
    post_in: PostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return post_service.update_post(db, post_id, post_in, current_user.id)


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return post_service.delete_post(db, post_id, current_user.id)
