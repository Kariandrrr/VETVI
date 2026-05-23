from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from .media_tags import MediaFileRead, TagRead
from .reactions import ReactionSummary
from .user import UserRead
from ..models.enums import PostType


class PostBase(BaseModel):
    post_type: PostType = PostType.text
    title: str | None = Field(None, max_length=300)
    body: str | None = None


class PostCreate(PostBase):
    attributed_to_member_id: UUID | None = None
    family_group_id: UUID


class PostUpdate(BaseModel):
    title: str | None = Field(None, max_length=300)
    body: str | None = None


class PostRead(BaseModel):
    id: UUID
    author_id: UUID
    attributed_to_member_id: UUID | None = None
    post_type: PostType
    title: str | None = None
    body: str | None = None
    created_at: datetime
    updated_at: datetime
    media: list[MediaFileRead] = []
    tags: list[TagRead] = []
    reactions: list[ReactionSummary] = []
    author: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)


class PostWithReactionSummary(PostRead):
    reaction_counts: dict = {}
    user_reaction: str | None = None
