import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .enums import MembershipRole


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    family_group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_groups.id", ondelete="CASCADE")
    )
    invited_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    assigned_role: Mapped[MembershipRole] = mapped_column(
        ENUM(MembershipRole, name="membership_role", inherit_schema=True),
        server_default="editor",
    )
    max_uses: Mapped[int] = mapped_column(server_default="1")
    times_used: Mapped[int] = mapped_column(server_default="0")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
