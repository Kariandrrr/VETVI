import os.path
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import FileResponse

from ...core.manager import manager
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
    family_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)
    file_id = str(post_id)

    try:
        await manager.send_progress(user_id, file_id, 5, "starting")
        await manager.add_upload(user_id, file_id)

        stmt = select(Post).where(Post.id == post_id)
        result = await db.execute(stmt)
        post = result.scalar()

        if not post:
            await manager.send_error(user_id, file_id, "Post not found")
            raise HTTPException(status_code=404, detail="Post not found")

        await manager.send_progress(user_id, file_id, 15, "post_validated")

        has_access = False

        if family_id:
            stmt = select(FamilyMember).where(
                FamilyMember.linked_user_id == current_user.id,
                FamilyMember.family_group_id == family_id,
                FamilyMember.family_group_id.in_(
                    select(FamilyMember.family_group_id).where(
                        FamilyMember.linked_user_id == post.author_id
                    )
                ),
            )
            result = await db.execute(stmt)
            has_access = bool(result.scalar())
        else:
            has_access = post.author_id == current_user.id

        if not has_access:
            await manager.send_error(user_id, file_id, "Access denied to this post")
            raise HTTPException(
                status_code=403, detail="You don't have access to this post"
            )

        await manager.send_progress(user_id, file_id, 25, "access_granted")
        await manager.send_progress(user_id, file_id, 40, "saving_file")

        result = await media_service.upload_media(db, post_id, file, current_user.id)

        await manager.send_progress(user_id, file_id, 100, "completed")
        await manager.remove_upload(user_id, file_id)

        return result

    except HTTPException:
        await manager.remove_upload(user_id, file_id)
        raise
    except Exception as e:
        await manager.send_error(user_id, file_id, str(e))
        await manager.remove_upload(user_id, file_id)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


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
                FamilyMember.linked_user_id == post.author_id
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


@router.delete("/media/{media_id}")
async def delete_media(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await media_service.delete_media(db, media_id, current_user.id)
    return {"message": "Media deleted"}


@router.patch("/media/{media_id}/order")
async def reorder_media(
    media_id: UUID,
    new_order: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await media_service.reorder_media(db, media_id, new_order, current_user.id)
    return {"message": "Order updated"}
