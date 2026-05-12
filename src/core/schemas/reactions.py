from uuid import UUID

from pydantic import BaseModel, ConfigDict

from ..models.enums import ReactionType


class ReactionCreate(BaseModel):
    reaction_type: ReactionType


class ReactionRead(BaseModel):
    post_id: UUID
    member_id: UUID
    reaction_type: ReactionType | None
    action: str


class ReactionSummary(BaseModel):
    reaction_type: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class PostReactionsResponse(BaseModel):
    post_id: UUID
    reactions: dict[str, int]
    total: int
