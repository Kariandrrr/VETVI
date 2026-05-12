from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from .media_tags import MediaFileRead, TagRead
from .reactions import ReactionSummary
from ..models.enums import PostType


class PostBase(BaseModel):
    post_type: PostType = PostType.text
    title: str | None = Field(None, max_length=300)
    body: str | None = None


class PostCreate(PostBase):
    attributed_to_member_id: UUID | None = None


class PostUpdate(BaseModel):
    title: str | None = Field(None, max_length=300)
    body: str | None = None


class PostRead(PostBase):
    id: UUID
    author_id: UUID
    attributed_to_member_id: UUID | None
    created_at: datetime
    updated_at: datetime
    media: list[MediaFileRead] = []
    tags: list[TagRead] = []
    reactions: list[ReactionSummary] = []

    model_config = ConfigDict(from_attributes=True)


class PostWithReactionSummary(PostRead):
    reaction_counts: dict = {}
    user_reaction: str | None = None
