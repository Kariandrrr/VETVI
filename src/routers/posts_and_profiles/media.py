import os.path
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import FileResponse

from ...core.models import Post, MediaFile
from ...core.models.families import MembershipRole
from ...core.models.members import FamilyMember
from ...deps.user import get_db, get_current_user
from ...deps.family import RoleChecker
from ...service.media_and_profiles import media as media_service

router = APIRouter()


@router.post("/posts/{post_id}/media", status_code=201)
async def upload_media_to_post(
    post_id: UUID,
    file: UploadFile = File(...),
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

    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == current_user.id,
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

    return await media_service.upload_media(db, post_id, file, current_user.id)


@router.get("/media/{media_id}/stream", status_code=200)
async def stream_media(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(
        RoleChecker(
            [MembershipRole.admin, MembershipRole.editor, MembershipRole.viewer]
        )
    ),
):
    stmt = select(MediaFile).where(MediaFile.id == media_id)
    result = await db.execute(stmt)
    media = result.scalar()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    stmt = select(Post).where(Post.id == media.post_id)
    result = await db.execute(stmt)
    post = result.scalar()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    stmt = select(FamilyMember).where(
        FamilyMember.linked_user_id == current_user.id,
        FamilyMember.family_group_id.in_(
            select(FamilyMember.family_group_id).where(
                FamilyMember.linked_user_id == post.user_id
            )
        ),
    )
    result = await db.execute(stmt)
    if not result.scalar():
        raise HTTPException(
            status_code=403, detail="You don't have access to this media"
        )

    if not os.path.exists(media.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        media.file_path, filename=media.original_name, media_type=media.mime_type
    )
