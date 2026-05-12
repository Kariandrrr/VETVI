import os
import uuid
from pathlib import Path
from uuid import UUID

import aiofiles
from fastapi import UploadFile, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
    stmt = select(Post).where(Post.id == post_id, Post.user_id == user_id)
    result = await db.execute(stmt)
    post = result.scalars().first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found or not yours")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    stmt = select(MediaFile).where(MediaFile.post_id == post_id)
    result = await db.execute(stmt)
    existing_media = result.scalars().all()
    sort_order = len(existing_media)

    ext = os.path.splitext(file.filename)[1] or _get_extension_from_mime(
        file.content_type
    )
    stored_name = f"{uuid.uuid4()}{ext}"

    file_dir = STORAGE_ROOT / str(user_id) / str(post_id)
    file_dir.mkdir(parents=True, exist_ok=True)
    file_path = file_dir / stored_name

    async with aiofiles.open(file_path, mode="wb") as f:
        await f.write(content)

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

    return MediaFileRead.model_validate(media)


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
