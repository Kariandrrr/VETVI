from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models.users import User
from ..core.schemas.user import UserCreate
from ..utils.utils_jwt import hash_password


async def get_user_by_username_or_email(
    db: AsyncSession,
    display_name: str,
) -> User | None:
    result = await db.execute(
        select(User).where(
            or_(
                User.display_name == display_name,
                User.email == display_name,
            )
        )
    )
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    user_in: UserCreate,
) -> User:
    hashed = hash_password(user_in.password)

    hashed_pwd = hashed.decode("utf-8") if isinstance(hashed, bytes) else hashed

    db_user = User(
        email=user_in.email,
        display_name=user_in.display_name,
        hashed_password=hashed_pwd,
        role=user_in.role,
        is_active=True,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
