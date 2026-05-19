import shutil
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile, File, HTTPException, Depends
from fastapi import (
    WebSocket,
    WebSocketDisconnect,
    APIRouter,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.manager import manager
from ...core.models import FamilyMember, User
from ...core.models.db_helper import get_db
from ...core.models.enums import MembershipRole
from ...deps.family import get_user_role_in_family
from ...deps.user import get_user_by_token_string, get_current_user

router = APIRouter()


@router.websocket("/ws/media")
async def websocket_media_endpoint(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
):
    user_id = None

    try:
        await websocket.accept()
        print("New WebSocket connection accepted")

        data = await websocket.receive_json()
        token = data.get("token")

        if not token:
            print("No token provided, closing connection")
            await websocket.close(code=1008, reason="No token provided")
            return

        try:
            user = await get_user_by_token_string(token, db)
            user_id = str(user.id)
            print(f"User authenticated: {user_id} ({user.email})")
        except HTTPException as e:
            print(f"Authentication failed: {e.detail}")
            await websocket.close(code=1008, reason="Invalid token")
            return

        await manager.connect(websocket, user_id)

        await manager.send_progress(user_id, "connection", 0, "connected")

        active_uploads = manager.get_active_uploads(user_id)
        if active_uploads:
            await websocket.send_json(
                {"type": "active_uploads", "file_ids": list(active_uploads)}
            )

        while True:
            try:
                message = await websocket.receive_json()
                action = message.get("action")

                print(f"Received from client {user_id}: {action}")

                if action == "ping":
                    await websocket.send_json(
                        {"type": "pong", "timestamp": __import__("time").time()}
                    )

                elif action == "get_status":
                    file_id = message.get("file_id")
                    if file_id:
                        await websocket.send_json(
                            {
                                "type": "status",
                                "file_id": file_id,
                                "status": "processing",
                                "progress": 50,
                            }
                        )
                    else:
                        await manager.send_error(user_id, "", "Missing file_id")

                elif action == "cancel_upload":
                    file_id = message.get("file_id")
                    if file_id:
                        print(f"Cancelling upload {file_id} for user {user_id}")
                        manager.remove_upload(user_id, file_id)
                        await websocket.send_json(
                            {"type": "upload_cancelled", "file_id": file_id}
                        )
                    else:
                        await manager.send_error(user_id, "", "Missing file_id")

                elif action == "get_active_uploads":
                    active = manager.get_active_uploads(user_id)
                    await websocket.send_json(
                        {"type": "active_uploads", "file_ids": list(active)}
                    )

                else:
                    await websocket.send_json(
                        {"type": "error", "message": f"Unknown action: {action}"}
                    )

            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"Error processing message from {user_id}: {e}")
                await websocket.send_json(
                    {"type": "error", "message": f"Internal error: {str(e)}"}
                )

    except WebSocketDisconnect:
        print(f"Client {user_id} disconnected")
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
    finally:
        if user_id:
            manager.disconnect(user_id)


AVATAR_UPLOAD_DIR = Path("uploads/avatars")
AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/ws/families/{family_group_id}/members/{member_id}/avatar")
async def upload_avatar(
    family_group_id: UUID,
    member_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = await get_user_role_in_family(db, current_user.id, family_group_id)

    if role is None:
        raise HTTPException(status_code=403, detail="You are not in this family group")

    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    is_self = member.linked_user_id == current_user.id
    is_admin = role == MembershipRole.admin

    if not (is_self or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed to edit this profile")

    if is_admin and not is_self:
        has_account = member.linked_user_id is not None
        is_deceased = member.is_alive is False

        if not (is_deceased or not has_account):
            raise HTTPException(
                status_code=403,
                detail="Admin can only edit deceased members or members without an account",
            )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must not exceed 5MB")

    file_extension = Path(file.filename).suffix.lower()
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Extension {file_extension} not allowed. Allowed: jpg, jpeg, png, gif, webp",
        )

    file_name = f"{member_id}{file_extension}"
    file_path = AVATAR_UPLOAD_DIR / file_name

    if member.avatar_url:
        old_avatar_path = Path(member.avatar_url.lstrip("/"))
        if old_avatar_path.exists() and old_avatar_path != file_path:
            old_avatar_path.unlink()
            print(f"Deleted old avatar: {old_avatar_path}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"Saved avatar to: {file_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    avatar_url = f"/uploads/avatars/{file_name}"

    member.avatar_url = avatar_url

    if member.linked_user_id:
        user_stmt = select(User).where(User.id == member.linked_user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar()
        if user:
            user.avatar_url = avatar_url
            print(f"Updated user {user.id} avatar_url")

    await db.commit()
    await db.refresh(member)

    return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully"}


@router.delete("/ws/families/{family_group_id}/members/{member_id}/avatar")
async def delete_avatar(
    family_group_id: UUID,
    member_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = await get_user_role_in_family(db, current_user.id, family_group_id)

    if role is None:
        raise HTTPException(status_code=403, detail="You are not in this family group")

    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id,
        FamilyMember.family_group_id == family_group_id,
    )
    result = await db.execute(stmt)
    member = result.scalar()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    is_self = member.linked_user_id == current_user.id
    is_admin = role == MembershipRole.admin

    if not (is_self or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed to delete this avatar")

    if is_admin and not is_self:
        has_account = member.linked_user_id is not None
        is_deceased = member.is_alive is False

        if not (is_deceased or not has_account):
            raise HTTPException(
                status_code=403,
                detail="Admin can only delete avatars of deceased members or members without an account",
            )

    if member.avatar_url:
        avatar_path = Path(member.avatar_url.lstrip("/"))
        if avatar_path.exists():
            avatar_path.unlink()

    member.avatar_url = None

    if member.linked_user_id:
        user_stmt = select(User).where(User.id == member.linked_user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar()
        if user:
            user.avatar_url = None

    await db.commit()
    await db.refresh(member)

    return {"message": "Avatar deleted successfully"}


@router.get("/ws/uploads/avatars/{file_name}")
async def get_avatar(file_name: str):
    file_path = AVATAR_UPLOAD_DIR / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")

    return FileResponse(
        file_path,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


@router.get("/ws/uploads/avatars/{file_name}")
async def get_avatar(file_name: str):
    if ".." in file_name or file_name.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid file name")

    file_path = AVATAR_UPLOAD_DIR / file_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")

    return FileResponse(
        file_path,
        media_type="image/jpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )
