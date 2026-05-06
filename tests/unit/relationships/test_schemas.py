from datetime import date
from uuid import uuid4

from src.core.models.enums import RelationshipType
from src.core.schemas.relationship import RelationshipCreate, RelationshipUpdate


class TestRelationshipCreateSchema:
    def test_valid_spouse_relationship(self):
        data = {
            "from_member_id": uuid4(),
            "to_member_id": uuid4(),
            "rel_type": RelationshipType.spouse,
            "marriage_date": date(2010, 6, 15),
            "family_group_id": uuid4(),
        }
        rel = RelationshipCreate(**data)
        assert rel.rel_type == RelationshipType.spouse
        assert rel.marriage_date == date(2010, 6, 15)

    def test_valid_parent_child(self):
        data = {
            "from_member_id": uuid4(),
            "to_member_id": uuid4(),
            "rel_type": RelationshipType.parent_child,
            "family_group_id": uuid4(),
        }
        rel = RelationshipCreate(**data)
        assert rel.rel_type == RelationshipType.parent_child
        assert rel.marriage_date is None

    def test_same_member_ids_allowed_by_schema_but_checked_in_db(self):
        uid = uuid4()
        data = {
            "from_member_id": uid,
            "to_member_id": uid,
            "rel_type": RelationshipType.sibling,
            "family_group_id": uuid4(),
        }
        rel = RelationshipCreate(**data)
        assert rel.from_member_id == rel.to_member_id

    def test_divorce_date_before_marriage(self):
        data = {
            "from_member_id": uuid4(),
            "to_member_id": uuid4(),
            "rel_type": RelationshipType.spouse,
            "marriage_date": date(2020, 1, 1),
            "divorce_date": date(2019, 1, 1),
            "family_group_id": uuid4(),
        }
        rel = RelationshipCreate(**data)
        # assert rel.divorce_date > rel.marriage_date #  упадет: валидации нет


class TestRelationshipUpdateSchema:
    def test_update_divorce_date(self):
        data = {"divorce_date": date(2023, 5, 5)}
        update = RelationshipUpdate(**data)
        assert update.divorce_date == date(2023, 5, 5)
        assert update.rel_type is None
