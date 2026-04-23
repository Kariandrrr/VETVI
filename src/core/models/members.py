import uuid
from datetime import datetime, date

from sqlalchemy import (
    String,
    Text,
    ForeignKey,
    Date,
    DateTime,
    Boolean,
    UniqueConstraint,
    CheckConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .enums import GenderEnum, RelationshipType


class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    family_group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_groups.id", ondelete="CASCADE"), index=True
    )
    linked_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    first_name: Mapped[str | None] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str | None] = mapped_column(String(100))
    patronymic: Mapped[str | None] = mapped_column(String(100))
    maiden_name: Mapped[str | None] = mapped_column(String(100))

    gender: Mapped[GenderEnum] = mapped_column(
        ENUM(GenderEnum, name="gender_enum", inherit_schema=True),
        default=GenderEnum.unknown,
    )
    birth_date: Mapped[date | None] = mapped_column(Date)
    birth_place: Mapped[str | None] = mapped_column(String(300))
    death_date: Mapped[date | None] = mapped_column(Date)
    death_place: Mapped[str | None] = mapped_column(String(300))
    is_alive: Mapped[bool] = mapped_column(Boolean, default=True)

    bio: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Relationship(Base):
    __tablename__ = "relationships"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    family_group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_groups.id", ondelete="CASCADE"), index=True
    )
    from_member_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), index=True
    )
    to_member_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), index=True
    )
    rel_type: Mapped[RelationshipType] = mapped_column(
        ENUM(RelationshipType, name="relationship_type", inherit_schema=True)
    )

    marriage_date: Mapped[date | None] = mapped_column(Date)
    divorce_date: Mapped[date | None] = mapped_column(Date)

    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "family_group_id",
            "from_member_id",
            "to_member_id",
            "rel_type",
            name="uq_relationships_group_members_type",
        ),
        CheckConstraint(
            "from_member_id != to_member_id", name="check_relationship_members_not_same"
        ),
    )
