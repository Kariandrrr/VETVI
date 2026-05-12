from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagUpdate(TagBase):
    pass


class TagRead(TagBase):
    id: UUID
    family_group_id: UUID

    model_config = ConfigDict(from_attributes=True)


class MediaFileRead(BaseModel):
    id: UUID
    post_id: UUID
    original_name: str
    stored_name: str
    mime_type: str
    file_size_bytes: int
    sort_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MediaFileUploadResponse(MediaFileRead):
    pass
