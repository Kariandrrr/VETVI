from uuid import uuid4

import pytest
from httpx import AsyncClient

from src.core.models.enums import ReactionType

pytestmark = pytest.mark.asyncio


class TestReactionsFlow:

    @pytest.mark.order(1)
    async def test_add_reaction_to_post(
        self, auth_client: AsyncClient, test_family: dict, test_post_id: str
    ):
        payload = {"reaction_type": ReactionType.like.value}

        response = await auth_client.post(
            f"/reactions/families/{test_family['id']}/posts/{test_post_id}/reactions",
            json=payload,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["post_id"] == test_post_id
        assert data["reaction_type"] == ReactionType.like.value
        assert data["action"] in ["added", "removed"]

    @pytest.mark.order(2)
    async def test_get_post_reactions_summary(
        self, auth_client: AsyncClient, test_family: dict, test_post_id: str
    ):
        response = await auth_client.get(
            f"/reactions/families/{test_family['id']}/posts/{test_post_id}/reactions"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["post_id"] == test_post_id
        assert "reactions" in data
        assert "total" in data
        assert isinstance(data["reactions"], dict)
        assert isinstance(data["total"], int)

    @pytest.mark.order(3)
    async def test_get_my_reaction(
        self, auth_client: AsyncClient, test_family: dict, test_post_id: str
    ):
        response = await auth_client.get(
            f"/reactions/families/{test_family['id']}/posts/{test_post_id}/my-reaction"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["post_id"] == test_post_id
        assert "member_id" in data or "id" in data
        assert "reaction_type" in data

    @pytest.mark.order(4)
    async def test_toggle_reaction_remove(
        self, auth_client: AsyncClient, test_family: dict, test_post_id: str
    ):
        payload = {"reaction_type": ReactionType.love.value}
        await auth_client.post(
            f"/reactions/families/{test_family['id']}/posts/{test_post_id}/reactions",
            json=payload,
        )

        response = await auth_client.post(
            f"/reactions/families/{test_family['id']}/posts/{test_post_id}/reactions",
            json=payload,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "removed"

    @pytest.mark.order(5)
    async def test_get_reactions_for_post_without_reactions(
        self, auth_client: AsyncClient, test_family: dict, test_member: dict
    ):
        member_id = (
            test_member.get("id")
            or test_member.get("member_id")
            or test_member.get("profile_id")
        )

        assert member_id, f"Member ID not found in test_member: {test_member}"

        post_payload = {
            "post_type": "text",
            "body": "Post for reaction testing",
            "attributed_to_member_id": member_id,
        }
        post_response = await auth_client.post("/posts/posts", json=post_payload)
        assert post_response.status_code == 201
        new_post_id = post_response.json()["id"]

        reactions_response = await auth_client.get(
            f"/reactions/families/{test_family['id']}/posts/{new_post_id}/reactions"
        )

        assert reactions_response.status_code == 200
        data = reactions_response.json()
        assert data["total"] == 0
        assert data["reactions"] == {}

    @pytest.mark.order(6)
    async def test_add_reaction_to_nonexistent_post(
        self, auth_client: AsyncClient, test_family: dict
    ):
        fake_id = uuid4()
        payload = {"reaction_type": ReactionType.like.value}

        response = await auth_client.post(
            f"/reactions/families/{test_family['id']}/posts/{fake_id}/reactions",
            json=payload,
        )

        assert response.status_code == 404

    @pytest.mark.order(7)
    async def test_add_reaction_unauthorized(
        self, client: AsyncClient, test_family: dict, test_post_id: str
    ):
        client.headers.pop("Authorization", None)

        payload = {"reaction_type": ReactionType.like.value}

        response = await client.post(
            f"/reactions/families/{test_family['id']}/posts/{test_post_id}/reactions",
            json=payload,
        )

        assert response.status_code == 401
