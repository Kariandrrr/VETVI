from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import (
    String,
    Text,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    Index,
    func,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import MembershipRole

if TYPE_CHECKING:
    from .users import User
    from .members import FamilyMember, Relationship
    from .invitation import Invitation


class FamilyGroup(Base):
    __tablename__ = "family_groups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    creator: Mapped["User"] = relationship(back_populates="groups_created")
    memberships: Mapped[List["FamilyMembership"]] = relationship(back_populates="group")
    members: Mapped[List["FamilyMember"]] = relationship(back_populates="group")
    invitations: Mapped[List["Invitation"]] = relationship(back_populates="group")
    relationships: Mapped[List["Relationship"]] = relationship(
        "Relationship",
        back_populates="group",
        cascade="all, delete-orphan",
    )
    is_favourite: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default=func.false()
    )


class FamilyMembership(Base):
    __tablename__ = "family_memberships"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    family_group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_groups.id", ondelete="CASCADE")
    )
    role: Mapped[MembershipRole] = mapped_column(
        ENUM(MembershipRole, name="membership_role", inherit_schema=True),
        default=MembershipRole.viewer,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "family_group_id"),
        Index("idx_memberships_user_group", "user_id", "family_group_id"),
    )

    user: Mapped["User"] = relationship(back_populates="memberships")
    group: Mapped["FamilyGroup"] = relationship(back_populates="memberships")
