import pytest

from src.core.models.enums import GenderEnum


class TestMembersFlow:

    @pytest.mark.order(1)
    async def test_create_member_success(self, auth_client):
        group_resp = await auth_client.post("/families/", json={"name": "Test Family"})
        assert group_resp.status_code == 201
        group_id = group_resp.json()["id"]

        member_data = {
            "first_name": "John",
            "last_name": "Doe",
            "gender": GenderEnum.male.value,
            "birth_date": "1980-01-01",
            "family_group_id": str(group_id),
            "is_alive": True,
        }

        resp = await auth_client.post("/families/members", json=member_data)
        assert resp.status_code == 201
        data = resp.json()
        assert data["first_name"] == "John"
        assert data["family_group_id"] == str(group_id)
        assert "created_at" in data

    @pytest.mark.order(2)
    async def test_get_member_by_id(self, auth_client):
        group_resp = await auth_client.post(
            "/families/", json={"name": "Get Test Group"}
        )
        group_id = group_resp.json()["id"]

        member_data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "gender": GenderEnum.female.value,
            "family_group_id": str(group_id),
        }
        create_resp = await auth_client.post("/families/members", json=member_data)
        member_id = create_resp.json()["id"]

        resp = await auth_client.get(f"/families/members/{member_id}")
        assert resp.status_code == 200
        assert resp.json()["last_name"] == "Doe"

    @pytest.mark.order(3)
    async def test_update_member(self, auth_client):
        group_resp = await auth_client.post(
            "/families/", json={"name": "Update Test Group"}
        )
        group_id = group_resp.json()["id"]

        member_data = {
            "first_name": "Old",
            "last_name": "Name",
            "gender": GenderEnum.unknown.value,
            "family_group_id": str(group_id),
        }
        create_resp = await auth_client.post("/families/members", json=member_data)
        member_id = create_resp.json()["id"]

        update_data = {"first_name": "New", "bio": "Updated biography"}
        resp = await auth_client.put(f"/families/members/{member_id}", json=update_data)
        assert resp.status_code == 200
        data = resp.json()
        assert data["first_name"] == "New"
        assert data["bio"] == "Updated biography"
        assert data["last_name"] == "Name"

    @pytest.mark.order(4)
    async def test_delete_member(self, auth_client):
        group_resp = await auth_client.post(
            "/families/", json={"name": "Delete Test Group"}
        )
        group_id = group_resp.json()["id"]

        member_data = {
            "first_name": "ToDelete",
            "last_name": "User",
            "gender": GenderEnum.male.value,
            "family_group_id": str(group_id),
        }
        create_resp = await auth_client.post("/families/members", json=member_data)
        member_id = create_resp.json()["id"]

        delete_resp = await auth_client.delete(f"/families/members/{member_id}")
        assert delete_resp.status_code == 204

        get_resp = await auth_client.get(f"/families/members/{member_id}")
        assert get_resp.status_code == 404

    @pytest.mark.order(5)
    async def test_uniqueness_check_name_dob(self, auth_client):
        group_resp = await auth_client.post(
            "/families/", json={"name": "Unique Test Group"}
        )
        group_id = group_resp.json()["id"]

        common_data = {
            "first_name": "Unique",
            "last_name": "Person",
            "gender": GenderEnum.male.value,
            "birth_date": "1990-01-01",
            "family_group_id": str(group_id),
        }

        resp1 = await auth_client.post("/families/members", json=common_data)
        assert resp1.status_code == 201

        resp2 = await auth_client.post("/families/members", json=common_data)
        assert resp2.status_code in [400, 409]
        assert "exists" in resp2.json().get("detail", "").lower()
