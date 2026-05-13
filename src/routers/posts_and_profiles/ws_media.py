from fastapi import WebSocket, WebSocketDisconnect, Depends, APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.manager import manager
from ...core.models.db_helper import get_db
from ...deps.user import get_user_by_token_string

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
