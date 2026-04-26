from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models.db_helper import get_db
from ..core.models.users import User
from ..core.schemas.user import UserRead, UserCreate, UserUpdate, Token
from ..crud.user import get_user_by_username_or_email, create_user
from ..utils.dependencies import get_current_user, admin_only
from ..utils.utils_jwt import encode_jwt, validate_password, hash_password

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/register", response_model=UserRead, status_code=201)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    if await get_user_by_username_or_email(db, user_in.display_name):
        raise HTTPException(status_code=400, detail="Username already registered")

    try:
        new_user = await create_user(db, user_in)
        return UserRead.model_validate(new_user)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    user = await get_user_by_username_or_email(db, form_data.username)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not validate_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = {
        "sub": str(user.id),
        "role": user.role.value,
    }
    token = encode_jwt(payload)
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
async def read_current_user(
    current_user=Depends(get_current_user),
):
    return current_user


@router.get("/users/{user_id}", response_model=UserRead)
async def read_user_by_id(
    user_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    update_data = user_in.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if current_user.role.value != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403, detail="You can only delete your own account"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role.value == "admin" and current_user.id == user_id:
        pass

    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()

    return {"message": "User deleted", "user_id": user_id}
