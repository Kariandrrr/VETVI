from datetime import datetime, date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.core.schemas.member_profile import (
    MemberProfileBase,
    MemberProfileCreate,
    MemberProfileUpdate,
    MemberProfileRead,
)


class TestMemberProfileBaseSchema:
    def test_valid_base_minimal(self):
        data = {}
        profile = MemberProfileBase(**data)
        assert profile.display_name is None
        assert profile.bio is None
        assert profile.avatar_url is None
        assert profile.date_of_birth is None

    def test_valid_base_full(self):
        dob = date(1990, 1, 1)
        data = {
            "display_name": "John Doe",
            "bio": "This is my bio",
            "avatar_url": "https://example.com/avatar.jpg",
            "date_of_birth": dob,
        }
        profile = MemberProfileBase(**data)
        assert profile.display_name == "John Doe"
        assert profile.bio == "This is my bio"
        assert profile.avatar_url == "https://example.com/avatar.jpg"
        assert profile.date_of_birth == dob

    def test_display_name_max_length(self):
        data = {"display_name": "a" * 100}
        profile = MemberProfileBase(**data)
        assert len(profile.display_name) == 100

    def test_bio_max_length(self):
        data = {"bio": "a" * 500}
        profile = MemberProfileBase(**data)
        assert len(profile.bio) == 500

    def test_avatar_url_max_length(self):
        data = {"avatar_url": "a" * 500}
        profile = MemberProfileBase(**data)
        assert len(profile.avatar_url) == 500

    def test_invalid_display_name_too_long(self):
        data = {"display_name": "a" * 101}
        with pytest.raises(ValidationError):
            MemberProfileBase(**data)

    def test_invalid_bio_too_long(self):
        data = {"bio": "a" * 501}
        with pytest.raises(ValidationError):
            MemberProfileBase(**data)

    def test_invalid_avatar_url_too_long(self):
        data = {"avatar_url": "a" * 501}
        with pytest.raises(ValidationError):
            MemberProfileBase(**data)


class TestMemberProfileCreateSchema:
    def test_valid_minimal_create(self):
        user_id = uuid4()
        family_group_id = uuid4()
        data = {
            "user_id": user_id,
            "family_group_id": family_group_id,
            "role": "member",
        }
        profile = MemberProfileCreate(**data)
        assert profile.user_id == user_id
        assert profile.family_group_id == family_group_id
        assert profile.role == "member"
        assert profile.display_name is None

    def test_valid_full_create(self):
        user_id = uuid4()
        family_group_id = uuid4()
        dob = date(1985, 5, 15)
        data = {
            "user_id": user_id,
            "family_group_id": family_group_id,
            "role": "admin",
            "display_name": "Jane Smith",
            "bio": "Family historian",
            "avatar_url": "https://example.com/jane.jpg",
            "date_of_birth": dob,
        }
        profile = MemberProfileCreate(**data)
        assert profile.user_id == user_id
        assert profile.family_group_id == family_group_id
        assert profile.role == "admin"
        assert profile.display_name == "Jane Smith"
        assert profile.bio == "Family historian"
        assert profile.avatar_url == "https://example.com/jane.jpg"
        assert profile.date_of_birth == dob

    def test_missing_required_fields(self):
        data = {"user_id": uuid4()}
        with pytest.raises(ValidationError):
            MemberProfileCreate(**data)

        data = {"family_group_id": uuid4()}
        with pytest.raises(ValidationError):
            MemberProfileCreate(**data)


class TestMemberProfileUpdateSchema:
    def test_partial_update(self):
        data = {"display_name": "Updated Name"}
        update = MemberProfileUpdate(**data)
        assert update.display_name == "Updated Name"
        assert update.bio is None
        assert update.avatar_url is None
        assert update.date_of_birth is None

    def test_full_update(self):
        dob = date(1995, 3, 10)
        data = {
            "display_name": "New Name",
            "bio": "New bio",
            "avatar_url": "https://example.com/new.jpg",
            "date_of_birth": dob,
        }
        update = MemberProfileUpdate(**data)
        assert update.display_name == "New Name"
        assert update.bio == "New bio"
        assert update.avatar_url == "https://example.com/new.jpg"
        assert update.date_of_birth == dob

    def test_empty_update(self):
        data = {}
        update = MemberProfileUpdate(**data)
        assert update.display_name is None
        assert update.bio is None
        assert update.avatar_url is None
        assert update.date_of_birth is None

    def test_update_bio_only(self):
        data = {"bio": "Just updating bio"}
        update = MemberProfileUpdate(**data)
        assert update.bio == "Just updating bio"
        assert update.display_name is None


class TestMemberProfileReadSchema:
    def test_valid_read(self):
        profile_id = uuid4()
        user_id = uuid4()
        family_group_id = uuid4()
        linked_user_id = uuid4()
        now = datetime.now()

        data = {
            "id": profile_id,
            "user_id": user_id,
            "family_group_id": family_group_id,
            "role": "member",
            "joined_at": now,
            "linked_user_id": linked_user_id,
            "display_name": "Test Member",
            "bio": "Test bio",
            "avatar_url": None,
            "date_of_birth": None,
        }
        profile = MemberProfileRead(**data)
        assert profile.id == profile_id
        assert profile.user_id == user_id
        assert profile.family_group_id == family_group_id
        assert profile.role == "member"
        assert profile.joined_at == now
        assert profile.linked_user_id == linked_user_id
        assert profile.display_name == "Test Member"
        assert profile.bio == "Test bio"

    def test_valid_read_with_all_fields(self):
        dob = date(1980, 8, 20)
        data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "family_group_id": uuid4(),
            "role": "admin",
            "joined_at": datetime.now(),
            "linked_user_id": uuid4(),
            "display_name": "Admin User",
            "bio": "Admin bio",
            "avatar_url": "https://example.com/admin.jpg",
            "date_of_birth": dob,
        }
        profile = MemberProfileRead(**data)
        assert profile.display_name == "Admin User"
        assert profile.avatar_url == "https://example.com/admin.jpg"
        assert profile.date_of_birth == dob

    def test_missing_required_fields(self):
        data = {"id": uuid4()}
        with pytest.raises(ValidationError):
            MemberProfileRead(**data)

    def test_config_from_attributes(self):
        assert MemberProfileRead.Config.from_attributes is True
