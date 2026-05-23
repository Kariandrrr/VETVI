from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from ..models.enums import RelationshipType


class RelationshipBase(BaseModel):
    from_member_id: UUID
    to_member_id: UUID
    rel_type: RelationshipType
    marriage_date: date | None = None
    divorce_date: date | None = None


class RelationshipCreate(RelationshipBase):
    family_group_id: UUID


class RelationshipRead(BaseModel):
    id: UUID
    family_group_id: UUID
    marriage_date: date | None = None
    divorce_date: date | None = None
    created_by: UUID
    created_at: datetime

    from_member_id: UUID = Field(..., serialization_alias="from_member_id")
    to_member_id: UUID = Field(..., serialization_alias="to_member_id")

    source_id: UUID = Field(
        ..., validation_alias="from_member_id", serialization_alias="source_id"
    )
    target_id: UUID = Field(
        ..., validation_alias="to_member_id", serialization_alias="target_id"
    )
    relationship_type: RelationshipType = Field(
        ..., validation_alias="rel_type", serialization_alias="relationship_type"
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class RelationshipUpdate(BaseModel):
    rel_type: RelationshipType | None = None
    marriage_date: date | None = None
    divorce_date: date | None = None
