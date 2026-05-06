import pytest

from src.core.models.enums import GenderEnum, RelationshipType


class TestRelationshipsFlow:
    async def _create_family_pair(self, client):
        group_resp = await client.post("/families/", json={"name": "Rel Test Group"})
        group_id = group_resp.json()["id"]

        m1_resp = await client.post(
            "/families/members",
            json={
                "first_name": "Father",
                "last_name": "Smith",
                "gender": GenderEnum.male.value,
                "birth_date": "1970-01-01",
                "family_group_id": str(group_id),
            },
        )
        m1 = m1_resp.json()

        m2_resp = await client.post(
            "/families/members",
            json={
                "first_name": "Mother",
                "last_name": "Smith",
                "gender": GenderEnum.female.value,
                "birth_date": "1972-01-01",
                "family_group_id": str(group_id),
            },
        )
        m2 = m2_resp.json()

        return group_id, m1["id"], m2["id"]

    @pytest.mark.order(1)
    async def test_create_spouse_relationship(self, auth_client, db_session):
        group_id, m1_id, m2_id = await self._create_family_pair(auth_client)

        payload = {
            "from_member_id": str(m1_id),
            "to_member_id": str(m2_id),
            "rel_type": RelationshipType.spouse.value,
            "marriage_date": "1995-06-15",
            "family_group_id": str(group_id),
        }
        resp = await auth_client.post("/families/relationships", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["rel_type"] == RelationshipType.spouse.value
        assert data["marriage_date"] == "1995-06-15"

    @pytest.mark.order(2)
    async def test_duplicate_relationship_prevented(self, auth_client, db_session):
        group_id, m1_id, m2_id = await self._create_family_pair(auth_client)

        payload = {
            "from_member_id": str(m1_id),
            "to_member_id": str(m2_id),
            "rel_type": RelationshipType.spouse.value,
            "family_group_id": str(group_id),
        }

        await auth_client.post("/families/relationships", json=payload)

        resp = await auth_client.post("/families/relationships", json=payload)
        assert resp.status_code in [400, 409]

    @pytest.mark.order(3)
    async def test_self_relationship_prevented(self, auth_client, db_session):
        group_id, m1_id, _ = await self._create_family_pair(auth_client)

        payload = {
            "from_member_id": str(m1_id),
            "to_member_id": str(m1_id),
            "rel_type": RelationshipType.sibling.value,
            "family_group_id": str(group_id),
        }

        resp = await auth_client.post("/families/relationships", json=payload)
        assert resp.status_code == 400

    @pytest.mark.order(4)
    async def test_create_parent_child_relationship(self, auth_client, db_session):
        group_id, parent_id, _ = await self._create_family_pair(auth_client)

        child_resp = await auth_client.post(
            "/families/members",
            json={
                "first_name": "Child",
                "last_name": "Smith",
                "gender": GenderEnum.male.value,
                "birth_date": "2000-01-01",
                "family_group_id": str(group_id),
            },
        )
        child = child_resp.json()

        payload = {
            "from_member_id": str(parent_id),
            "to_member_id": str(child["id"]),
            "rel_type": RelationshipType.parent_child.value,
            "family_group_id": str(group_id),
        }

        resp = await auth_client.post("/families/relationships", json=payload)
        assert resp.status_code == 201

    @pytest.mark.order(5)
    async def test_update_relationship_add_divorce(self, auth_client, db_session):
        group_id, m1_id, m2_id = await self._create_family_pair(auth_client)

        create_payload = {
            "from_member_id": str(m1_id),
            "to_member_id": str(m2_id),
            "rel_type": RelationshipType.spouse.value,
            "marriage_date": "1990-01-01",
            "family_group_id": str(group_id),
        }
        create_resp = await auth_client.post(
            "/families/relationships", json=create_payload
        )
        rel_id = create_resp.json()["id"]

        update_payload = {"divorce_date": "2023-01-01"}
        resp = await auth_client.put(
            f"/families/relationships/{rel_id}", json=update_payload
        )

        assert resp.status_code == 200
        assert resp.json()["divorce_date"] == "2023-01-01"

    @pytest.mark.order(6)
    async def test_delete_relationship(self, auth_client, db_session):
        group_id, m1_id, m2_id = await self._create_family_pair(auth_client)

        create_payload = {
            "from_member_id": str(m1_id),
            "to_member_id": str(m2_id),
            "rel_type": RelationshipType.sibling.value,
            "family_group_id": str(group_id),
        }
        create_resp = await auth_client.post(
            "/families/relationships", json=create_payload
        )
        rel_id = create_resp.json()["id"]

        resp = await auth_client.delete(f"/families/relationships/{rel_id}")
        assert resp.status_code == 204

        get_resp = await auth_client.get(f"/families/relationships/{rel_id}")
        assert get_resp.status_code == 404
