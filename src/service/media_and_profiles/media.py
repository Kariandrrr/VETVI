import os
import uuid
from pathlib import Path
from uuid import UUID

import aiofiles
from fastapi import UploadFile, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.manager import manager
from ...core.models.content import MediaFile, Post
from ...core.schemas.media_tags import MediaFileRead

STORAGE_ROOT = Path("./uploads/user_media")
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
}


async def upload_media(
    db: AsyncSession,
    post_id: UUID,
    file: UploadFile,
    user_id: UUID,
) -> MediaFileRead:

    user_id_str = str(user_id)
    post_id_str = str(post_id)

    try:
        await manager.send_progress(user_id_str, post_id_str, 5, "checking_post")

        stmt = select(Post).where(Post.id == post_id, Post.author_id == user_id)
        result = await db.execute(stmt)
        post = result.scalars().first()

        if not post:
            await manager.send_error(
                user_id_str, post_id_str, "Post not found or not yours"
            )
            raise HTTPException(status_code=404, detail="Post not found or not yours")

        await manager.send_progress(user_id_str, post_id_str, 10, "post_validated")

        await manager.send_progress(user_id_str, post_id_str, 15, "checking_file_type")

        if file.content_type not in ALLOWED_MIME_TYPES:
            error_msg = (
                f"Unsupported file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
            )
            await manager.send_error(user_id_str, post_id_str, error_msg)
            raise HTTPException(status_code=400, detail=error_msg)

        await manager.send_progress(user_id_str, post_id_str, 20, "file_type_validated")

        await manager.send_progress(user_id_str, post_id_str, 25, "reading_file")

        content = await file.read()

        if not content:
            await manager.send_error(user_id_str, post_id_str, "Empty file")
            raise HTTPException(status_code=400, detail="Empty file")

        await manager.send_progress(user_id_str, post_id_str, 35, "file_read")

        await manager.send_progress(user_id_str, post_id_str, 40, "checking_file_size")

        if len(content) > MAX_FILE_SIZE:
            error_msg = f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)} MB"
            await manager.send_error(user_id_str, post_id_str, error_msg)
            raise HTTPException(status_code=413, detail=error_msg)

        await manager.send_progress(user_id_str, post_id_str, 45, "file_size_validated")

        await manager.send_progress(user_id_str, post_id_str, 50, "checking_order")

        stmt = select(MediaFile).where(MediaFile.post_id == post_id)
        result = await db.execute(stmt)
        existing_media = result.scalars().all()
        sort_order = len(existing_media)

        await manager.send_progress(user_id_str, post_id_str, 55, "order_validated")

        await manager.send_progress(user_id_str, post_id_str, 60, "preparing_storage")

        ext = os.path.splitext(file.filename)[1] or _get_extension_from_mime(
            file.content_type
        )
        stored_name = f"{uuid.uuid4()}{ext}"

        file_dir = STORAGE_ROOT / str(user_id) / str(post_id)
        file_dir.mkdir(parents=True, exist_ok=True)
        file_path = file_dir / stored_name

        await manager.send_progress(user_id_str, post_id_str, 65, "storage_prepared")

        await manager.send_progress(user_id_str, post_id_str, 70, "saving_file")

        async with aiofiles.open(file_path, mode="wb") as f:
            await f.write(content)

        await manager.send_progress(user_id_str, post_id_str, 85, "file_saved")

        await manager.send_progress(user_id_str, post_id_str, 90, "creating_record")

        media = MediaFile(
            post_id=post_id,
            user_id=user_id,
            original_name=file.filename,
            stored_name=stored_name,
            file_path=str(file_path),
            mime_type=file.content_type,
            file_size_bytes=len(content),
            sort_order=sort_order,
        )

        db.add(media)
        await db.commit()
        await db.refresh(media)

        await manager.send_progress(user_id_str, post_id_str, 95, "record_created")

        await manager.send_progress(user_id_str, post_id_str, 100, "completed")

        return MediaFileRead.model_validate(media)

    except HTTPException:
        raise
    except Exception as e:
        await manager.send_error(user_id_str, post_id_str, str(e))
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


async def delete_media(
    db: AsyncSession,
    media_id: UUID,
    user_id: UUID,
) -> None:
    stmt = select(MediaFile).where(
        MediaFile.id == media_id, MediaFile.user_id == user_id
    )
    result = await db.execute(stmt)
    media = result.scalar()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found or not yours")

    if os.path.exists(media.file_path):
        os.remove(media.file_path)

    await db.delete(media)
    await db.commit()


async def get_media_by_id(
    db: AsyncSession,
    media_id: UUID,
) -> MediaFile:
    stmt = select(MediaFile).where(MediaFile.id == media_id)
    result = await db.execute(stmt)
    media = result.scalar()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    if not os.path.exists(media.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return media


def _get_extension_from_mime(mime_type: str) -> str:
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "audio/ogg": ".ogg",
    }
    return mapping.get(mime_type, ".bin")
