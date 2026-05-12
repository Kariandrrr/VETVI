from typing import Optional, Dict
from uuid import UUID

from pydantic import BaseModel

from ..models.enums import ReactionType


class ReactionCreate(BaseModel):
    reaction_type: ReactionType


class ReactionRead(BaseModel):
    post_id: UUID
    member_id: UUID
    reaction_type: Optional[ReactionType]
    action: str


class ReactionSummary(BaseModel):
    reaction_type: str
    count: int

    class Config:
        from_attributes = True


class PostReactionsResponse(BaseModel):
    post_id: UUID
    reactions: Dict[str, int]
    total: int
