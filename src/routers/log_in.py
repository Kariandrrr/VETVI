from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.models.db_helper import get_db
from ..core.models.users import User
from ..core.schemas.user import UserRead, UserCreate, UserUpdate, Token
from ..service.user import get_user_by_username_or_email, create_user
from src.deps.user import get_current_user
from ..utils.utils_jwt import encode_jwt, validate_password, hash_password, decode_jwt

router = APIRouter()


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
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    user = await get_user_by_username_or_email(db, form_data.username)
    if not user or not validate_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = str(user.id)

    access_token = encode_jwt(
        payload={"sub": user_id_str, "role": user.role.value, "type": "access"},
        expires_minutes=15,
    )
    refresh_token = encode_jwt(
        payload={
            "sub": user_id_str,
            "type": "refresh",
        },
        expires_minutes=60 * 24 * 7,
    )

    response.set_cookie(
        key=settings.auth_jwt.cookie.name_refresh,
        value=refresh_token,
        httponly=settings.auth_jwt.cookie.http_only,
        secure=settings.auth_jwt.cookie.secure,
        samesite=settings.auth_jwt.cookie.same_site,
        max_age=settings.auth_jwt.cookie.max_age_refresh,
    )

    return Token(access_token=access_token, refresh_token="stored_in_cookie")


@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(
        None, alias=settings.auth_jwt.cookie.name_refresh
    ),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token is missing")

    try:
        payload = decode_jwt(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        new_access = encode_jwt(
            {"sub": str(user.id), "role": user.role.value, "type": "access"},
            expires_minutes=15,
        )
        new_refresh = encode_jwt(
            {"sub": str(user.id), "type": "refresh"},
            expires_minutes=60 * 24 * 7,
        )
        response.set_cookie(
            key="refresh_token",
            value=new_refresh,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=86400,
        )
        return {"access_token": new_access, "token_type": "bearer"}

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}


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
