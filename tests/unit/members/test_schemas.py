from datetime import date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.core.models.enums import GenderEnum
from src.core.schemas.family_members import FamilyMemberCreate, FamilyMemberUpdate


class TestFamilyMemberCreateSchema:
    def test_valid_minimal_create(self):
        data = {
            "first_name": "Ivan",
            "last_name": "Petrov",
            "family_group_id": uuid4(),
            "gender": GenderEnum.male,
        }
        member = FamilyMemberCreate(**data)
        assert member.first_name == "Ivan"
        assert member.gender == GenderEnum.male
        assert member.is_alive is True

    def test_valid_full_create(self):
        data = {
            "first_name": "Anna",
            "last_name": "Ivanova",
            "patronymic": "Sergeevna",
            "maiden_name": "Smirnova",
            "gender": GenderEnum.female,
            "birth_date": date(1990, 5, 20),
            "birth_place": "Moscow",
            "is_alive": True,
            "bio": "Test bio",
            "family_group_id": uuid4(),
            "linked_user_id": uuid4(),
        }
        member = FamilyMemberCreate(**data)
        assert member.maiden_name == "Smirnova"
        assert member.birth_date == date(1990, 5, 20)

    def test_death_date_validation_logic(self):
        data = {
            "first_name": "Deceased",
            "last_name": "Person",
            "family_group_id": uuid4(),
            "death_date": date(2020, 1, 1),
            "is_alive": False,
        }
        member = FamilyMemberCreate(**data)
        assert member.death_date == date(2020, 1, 1)
        assert member.is_alive is False

    def test_missing_required_fields(self):
        data = {"first_name": "NoLastname"}
        with pytest.raises(ValidationError):
            FamilyMemberCreate(**data)


class TestFamilyMemberUpdateSchema:
    def test_partial_update(self):
        data = {"bio": "Updated bio"}
        update = FamilyMemberUpdate(**data)
        assert update.bio == "Updated bio"
        assert update.first_name is None

    def test_update_linked_user(self):
        uid = uuid4()
        data = {"linked_user_id": uid}
        update = FamilyMemberUpdate(**data)
        assert update.linked_user_id == uid
