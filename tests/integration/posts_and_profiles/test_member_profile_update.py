from uuid import uuid4

import pytest
from httpx import AsyncClient, ASGITransport

from src.main import app

pytestmark = pytest.mark.asyncio


class TestMemberProfileUpdate:

    @pytest.mark.order(1)
    async def test_update_own_profile(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        member_id = test_member.get("id")

        payload = {
            "first_name": "UpdatedFirstName",
            "last_name": "UpdatedLastName",
            "patronymic": "UpdatedPatronymic",
            "maiden_name": "UpdatedMaidenName",
            "gender": "male",
            "birth_date": "1990-05-15",
            "birth_place": "Moscow",
            "bio": "This is my updated bio",
            "avatar_url": "https://example.com/new-avatar.jpg",
            "display_name": "New Display Name",
        }

        response = await auth_client.patch(
            f"/profiles/families/{test_family['id']}/members/{member_id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()

        assert data["first_name"] == payload["first_name"]
        assert data["last_name"] == payload["last_name"]
        assert data["patronymic"] == payload["patronymic"]
        assert data["maiden_name"] == payload["maiden_name"]
        assert data["gender"] == payload["gender"]
        assert data["bio"] == payload["bio"]
        assert data["avatar_url"] == payload["avatar_url"]
        assert data["display_name"] == payload["display_name"]

        assert data["role"] == test_member.get("role")

    @pytest.mark.order(2)
    async def test_update_own_profile_role_forbidden(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        member_id = test_member.get("id")
        original_role = test_member.get("role")

        payload = {
            "role": "admin",
            "bio": "Updated bio",
        }

        response = await auth_client.patch(
            f"/profiles/families/{test_family['id']}/members/{member_id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()

        assert data["role"] == original_role
        assert data["bio"] == payload["bio"]

    @pytest.mark.order(3)
    async def test_update_own_profile_death_fields_forbidden(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        member_id = test_member.get("id")

        payload = {
            "is_alive": False,
            "death_date": "2024-01-01",
            "death_place": "Hospital",
            "bio": "Updated bio",
        }

        response = await auth_client.patch(
            f"/profiles/families/{test_family['id']}/members/{member_id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()

        assert data["is_alive"] != False
        assert (
            data.get("death_date") is None
            or data.get("death_date") != payload["death_date"]
        )
        assert data.get("death_place") != payload["death_place"]
        assert data["bio"] == payload["bio"]

    @pytest.mark.order(4)
    async def test_update_other_user_profile_forbidden(
        self, auth_client: AsyncClient, test_family: dict
    ):
        another_user_payload = {
            "email": "another@example.com",
            "password": "password123",
            "first_name": "Another",
            "last_name": "User",
        }

        register_response = await auth_client.post(
            "/auth/register", json=another_user_payload
        )

        if register_response.status_code == 422:
            another_user_payload["display_name"] = "Another User"
            register_response = await auth_client.post(
                "/auth/register", json=another_user_payload
            )

        if register_response.status_code not in [200, 201]:
            pytest.skip(f"Cannot create user: {register_response.text}")

        login_response = await auth_client.post(
            "/auth/login",
            data={
                "username": another_user_payload["email"],
                "password": another_user_payload["password"],
            },
        )

        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        another_token = login_response.json()["access_token"]

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            headers={"Authorization": f"Bearer {another_token}"},
        ) as another_client:

            user_response = await another_client.get("/auth/me")
            assert user_response.status_code == 200
            user_data = user_response.json()
            user_id = user_data["id"]

            add_response = await auth_client.post(
                "/families/members",
                json={
                    "family_group_id": str(test_family["id"]),
                    "linked_user_id": str(user_id),
                    "first_name": another_user_payload["first_name"],
                    "last_name": another_user_payload["last_name"],
                    "patronymic": "",
                    "maiden_name": "",
                    "gender": "unknown",
                    "birth_date": None,
                    "birth_place": "",
                    "death_date": None,
                    "death_place": "",
                    "is_alive": True,
                    "bio": "",
                    "avatar_url": "",
                },
            )
            assert add_response.status_code in [200, 201, 400]

            member_response = await another_client.get(
                f"/profiles/families/{test_family['id']}/members/me"
            )

            if member_response.status_code != 200:
                pytest.skip("Another user is not a member of the family")

            another_member = member_response.json()
            another_member_id = another_member["id"]

            response = await auth_client.patch(
                f"/profiles/families/{test_family['id']}/members/{another_member_id}",
                json={"bio": "Hacked bio"},
            )

            assert response.status_code == 403

    @pytest.mark.order(6)
    async def test_update_nonexistent_member(
        self, auth_client: AsyncClient, test_family: dict
    ):
        fake_member_id = uuid4()

        response = await auth_client.patch(
            f"/profiles/families/{test_family['id']}/members/{fake_member_id}",
            json={"bio": "Test"},
        )

        assert response.status_code == 404
        assert "Profile not found" in response.text

    @pytest.mark.order(7)
    async def test_update_member_wrong_family(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        other_family_response = await auth_client.post(
            "/families/", json={"name": "Other Family", "description": "Another family"}
        )
        other_family = other_family_response.json()
        other_family_id = other_family["id"]

        member_id = test_member.get("id")

        response = await auth_client.patch(
            f"/profiles/families/{other_family_id}/members/{member_id}",
            json={"bio": "Trying to update"},
        )

        assert response.status_code == 404 or response.status_code == 403
