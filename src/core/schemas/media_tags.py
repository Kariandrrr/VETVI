from uuid import UUID

from pydantic import BaseModel

from .base import BaseSchema


class MediaFileRead(BaseSchema):
    id: UUID
    original_name: str
    file_path: str
    mime_type: str
    file_size_bytes: int
    sort_order: int


class TagRead(BaseSchema):
    id: UUID
    name: str


class MediaFileUpdate(BaseModel):
    sort_order: int | None = None


class TagUpdate(BaseModel):
    name: str | None = None
