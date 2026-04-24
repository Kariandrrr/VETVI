from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from ..core.config import settings


def encode_jwt(
    payload: dict,
    private_key: str = settings.auth_jwt.private_key_path.read_text(),
    algorithm: str = settings.auth_jwt.algorithm,
    expires_minutes: int = settings.auth_jwt.access_token_expire_minutes,
    expire_timedelta: timedelta | None = None,
):
    to_encode = payload.copy()
    now = datetime.now(tz=timezone.utc)
    if expire_timedelta:
        expire_time = now + expire_timedelta
    else:
        expire_time = now + timedelta(minutes=expires_minutes)
    to_encode.update(exp=expire_time, iat=now)
    encoded = jwt.encode(to_encode, private_key, algorithm=algorithm)
    return encoded


def decode_jwt(
    token: str | bytes,
    public_key: str = settings.auth_jwt.public_key_path.read_text(),
    algorithm: str = settings.auth_jwt.algorithm,
):
    decoded = jwt.decode(token, public_key, algorithms=[algorithm])
    return decoded


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    pwd_bytes: bytes = password.encode()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode()


def validate_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed_password.encode())
