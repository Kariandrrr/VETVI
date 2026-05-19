from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import (
    String,
    Text,
    ForeignKey,
    DateTime,
    Integer,
    Table,
    Column,
    UniqueConstraint,
    func,
    BigInteger,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base
from .enums import PostType

if TYPE_CHECKING:
    from .users import User


post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    family_group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_groups.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    attributed_to_member_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("family_members.id", ondelete="SET NULL"), index=True
    )

    post_type: Mapped[PostType] = mapped_column(
        ENUM(PostType, name="post_type", inherit_schema=True), default=PostType.text
    )
    title: Mapped[str | None] = mapped_column(String(300))
    body: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    author: Mapped["User"] = relationship(
        "User",
        foreign_keys=[author_id],
        back_populates="posts",
    )

    media: Mapped[List["MediaFile"]] = relationship(back_populates="post")
    tags: Mapped[List["Tag"]] = relationship(
        secondary=post_tags, back_populates="posts"
    )
    reactions = relationship(
        "PostReaction", back_populates="post", cascade="all, delete-orphan"
    )


class MediaFile(Base):
    __tablename__ = "media_files"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    original_name: Mapped[str] = mapped_column(String(500))
    stored_name: Mapped[str] = mapped_column(String(500))
    file_path: Mapped[str] = mapped_column(String(1000))
    mime_type: Mapped[str] = mapped_column(String(100))
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)

    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    post: Mapped["Post"] = relationship(back_populates="media")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    family_group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_groups.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    __table_args__ = (UniqueConstraint("family_group_id", "name"),)
    posts: Mapped[List["Post"]] = relationship(
        secondary=post_tags, back_populates="tags"
    )


class PostReaction(Base):
    __tablename__ = "post_reactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), index=True
    )
    member_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), index=True
    )
    reaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("post_id", "member_id", name="unique_post_member_reaction"),
    )

    post: Mapped["Post"] = relationship(back_populates="reactions")
