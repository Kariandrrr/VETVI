from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.user_uploads: dict[str, set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if user_id not in self.user_uploads:
            self.user_uploads[user_id] = set()
        print(
            f"User {user_id} connected. Total connections: {len(self.active_connections)}"
        )

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(
                f"User {user_id} disconnected. Total connections: {len(self.active_connections)}"
            )

    async def send_progress(
        self, user_id: str, file_id: str, progress: int, status: str
    ):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(
                    {
                        "type": "progress",
                        "file_id": file_id,
                        "progress": progress,
                        "status": status,
                    }
                )
                print(f"Sent progress to {user_id}: {file_id} - {progress}% ({status})")
            except Exception as e:
                print(f"Error sending to user {user_id}: {e}")
                self.disconnect(user_id)

    async def send_error(self, user_id: str, file_id: str, message: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(
                    {"type": "error", "file_id": file_id, "message": message}
                )
            except Exception as e:
                print(f"Error sending error to user {user_id}: {e}")

    async def send_upload_started(self, user_id: str, file_id: str, filename: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(
                    {"type": "upload_started", "file_id": file_id, "filename": filename}
                )
            except Exception:
                pass

    def add_upload(self, user_id: str, file_id: str):
        if user_id in self.user_uploads:
            self.user_uploads[user_id].add(file_id)

    def remove_upload(self, user_id: str, file_id: str):
        if user_id in self.user_uploads:
            self.user_uploads[user_id].discard(file_id)

    def get_active_uploads(self, user_id: str) -> set[str]:
        return self.user_uploads.get(user_id, set())


manager = ConnectionManager()
