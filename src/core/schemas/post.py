from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field

from ..models.enums import PostType
from .media_tags import MediaFileRead, TagRead
from .reactions import ReactionSummary


class PostBase(BaseModel):
    post_type: PostType = PostType.text
    title: Optional[str] = Field(None, max_length=300)
    body: Optional[str] = None
    event_date: Optional[date] = None
    event_description: Optional[str] = Field(None, max_length=500)


class PostCreate(PostBase):
    attributed_to_member_id: Optional[UUID] = None


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    body: Optional[str] = None
    event_date: Optional[date] = None
    event_description: Optional[str] = Field(None, max_length=500)


class PostRead(PostBase):
    id: UUID
    user_id: UUID
    attributed_to_member_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    media: List[MediaFileRead] = []
    tags: List[TagRead] = []
    reactions: List[ReactionSummary] = []

    class Config:
        from_attributes = True


class PostWithReactionSummary(PostRead):
    reaction_counts: dict = {}
    user_reaction: Optional[str] = None
