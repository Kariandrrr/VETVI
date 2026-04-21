import enum
import sys

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy.orm import Mapped, mapped_column

is_alembic_running = "alembic" in sys.modules or "alembic" in sys.argv[0]

from ..config import settings
from ...utils import camel_case_to_snake_case


class Base(DeclarativeBase):
    __abstract__ = True

    metadata = MetaData(naming_convention=settings.db.naming_convention)

    @declared_attr
    def __tablename__(cls) -> str:
        return f"{camel_case_to_snake_case(cls.__name__)}s"

    id: Mapped[int] = mapped_column(primary_key=True)


class MembershipRole(enum.Enum):
    admin = "admin"
    editor = "editor"
    viewer = "viewer"


class GenderEnum(enum.Enum):
    male = "male"
    female = "female"
    other = "other"
    unknown = "unknown"


class RelationshipType(enum.Enum):
    parent_child = "parent_child"
    spouse = "spouse"


class PostType(enum.Enum):
    text = "text"
    photo = "photo"
    audio = "audio"
    video = "video"
    document = "document"
