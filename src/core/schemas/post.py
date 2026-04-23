from datetime import datetime, date
from typing import List
from uuid import UUID

from pydantic import BaseModel

from .base import BaseSchema
from .media_tags import MediaFileRead, TagRead
from ..models.enums import PostType


class PostBase(BaseModel):
    family_group_id: UUID
    belongs_to_member_id: UUID
    attributed_to_member_id: UUID | None = None
    post_type: PostType = PostType.text
    title: str | None = None
    body: str | None = None
    event_date: date | None = None
    event_description: str | None = None


class PostCreate(PostBase):
    pass


class PostRead(PostBase, BaseSchema):
    id: UUID
    author_user_id: UUID
    created_at: datetime
    updated_at: datetime
    media: List["MediaFileRead"] = []
    tags: List["TagRead"] = []


class PostUpdate(BaseModel):
    attributed_to_member_id: UUID | None = None
    title: str | None = None
    body: str | None = None
    event_date: date | None = None
    event_description: str | None = None
