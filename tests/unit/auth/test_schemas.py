import pytest
from pydantic import ValidationError

from src.core.models.enums import MembershipRole
from src.core.schemas.user import UserCreate, UserUpdate


class TestUserCreateSchema:
    def test_valid_user_create(self):
        data = {
            "display_name": "test_user",
            "email": "test@example.com",
            "password": "StrongPass123!",
        }
        user = UserCreate(**data)
        assert user.display_name == "test_user"
        assert user.email == "test@example.com"

    def test_valid_user_create_custom_role(self):
        data = {
            "email": "admin@example.com",
            "password": "StrongPass123!",
            "display_name": "admin_user",
            "role": MembershipRole.admin,
        }
        user = UserCreate(**data)
        assert user.role == MembershipRole.admin

    def test_invalid_email_format(self):
        data = {
            "email": "not-an-email",
            "password": "StrongPass123!",
            "display_name": "user",
        }
        with pytest.raises(ValidationError):
            UserCreate(**data)

    def test_missing_required_fields(self):
        data = {"email": "test@example.com"}
        with pytest.raises(ValidationError):
            UserCreate(**data)


class TestUserUpdateSchema:
    def test_partial_update(self):
        data = {"display_name": "new_name"}
        update = UserUpdate(**data)
        assert update.display_name == "new_name"
        assert update.email is None

    def test_password_as_bytes(self):
        data = {"password": b"binary_password"}
        update = UserUpdate(**data)
        assert update.password == b"binary_password"
