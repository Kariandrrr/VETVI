from uuid import uuid4

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestProfilesFlow:

    @pytest.mark.order(1)
    async def test_get_my_profile(self, auth_client: AsyncClient, test_family: dict):
        response = await auth_client.get(
            f"/profiles/families/{test_family['id']}/members/me"
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "user_id" in data
        assert "family_group_id" in data
        assert data["family_group_id"] == test_family["id"]
        assert "role" in data
        assert "joined_at" in data
        assert "linked_user_id" in data

    @pytest.mark.order(2)
    async def test_get_member_profile_by_id(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        member_id = test_member.get("id")
        family_id = test_family.get("id")

        response = await auth_client.get(
            f"/profiles/families/{test_family['id']}/members/{member_id}",
            params={"family_id": family_id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == member_id
        assert data["family_group_id"] == test_family["id"]

    @pytest.mark.order(3)
    async def test_get_all_family_members(
        self, auth_client: AsyncClient, test_family: dict
    ):
        family_id = test_family.get("id")

        response = await auth_client.get(
            f"/profiles/families/{test_family['id']}/members",
            params={"family_id": family_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for member in data:
            assert "id" in member
            assert "family_group_id" in member
            assert member["family_group_id"] == test_family["id"]

    @pytest.mark.order(4)
    async def test_update_member_profile(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        member_id = test_member.get("id")

        payload = {
            "display_name": "Updated Display Name",
            "bio": "This is my updated bio",
        }

        response = await auth_client.patch(
            f"/profiles/families/{test_family['id']}/members/{member_id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == payload["display_name"]
        assert data["bio"] == payload["bio"]

    @pytest.mark.order(5)
    async def test_update_member_profile_partial(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        member_id = (
            test_member.get("id")
            or test_member.get("member_id")
            or test_member.get("profile_id")
        )

        payload = {"bio": "Only bio updated"}

        response = await auth_client.patch(
            f"/profiles/families/{test_family['id']}/members/{member_id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["bio"] == "Only bio updated"

    @pytest.mark.order(6)
    async def test_get_nonexistent_member_profile(
        self, auth_client: AsyncClient, test_family: dict
    ):
        fake_id = uuid4()
        family_id = test_family["id"]

        response = await auth_client.get(
            f"/profiles/families/{test_family['id']}/members/{fake_id}",
            params={"family_id": family_id},
        )

        assert response.status_code == 404

    @pytest.mark.order(7)
    async def test_update_profile_unauthorized(
        self, client: AsyncClient, test_family: dict, test_member: dict
    ):
        client.headers.pop("Authorization", None)

        member_id = test_member.get("id")
        payload = {"display_name": "Hacked"}

        response = await client.patch(
            f"/profiles/families/{test_family['id']}/members/{member_id}", json=payload
        )

        assert response.status_code == 401
