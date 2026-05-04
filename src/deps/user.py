from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.utils.utils_jwt import decode_jwt
from src.core.models.db_helper import get_db
from src.core.models.enums import MembershipRole
from src.core.models.families import FamilyMembership
from src.core.models.users import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_jwt(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def admin_only(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


class GroupRoleChecker:
    def __init__(self, required_role: MembershipRole):
        self.required_role = required_role

    async def __call__(
        self,
        family_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        query = select(FamilyMembership).where(
            FamilyMembership.family_group_id == family_id,
            FamilyMembership.user_id == current_user.id,
        )
        result = await db.execute(query)
        membership = result.scalar_one_or_none()

        if not membership:
            raise HTTPException(
                status_code=403, detail="You are not a member of this family group"
            )

        roles_hierarchy = {
            MembershipRole.admin: 3,
            MembershipRole.editor: 2,
            MembershipRole.viewer: 1,
        }

        user_level = roles_hierarchy.get(membership.role, 0)
        required_level = roles_hierarchy.get(self.required_role, 0)

        if user_level < required_level:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Requires {self.required_role} role in this group.",
            )
        return membership
