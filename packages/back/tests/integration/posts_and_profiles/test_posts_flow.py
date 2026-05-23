from uuid import uuid4

import pytest
from httpx import AsyncClient

from src.core.models.enums import PostType
from tests.integration.posts_and_profiles.conftest import test_member

pytestmark = pytest.mark.asyncio


class TestPostsFlow:

    @pytest.mark.order(1)
    async def test_create_post(self, auth_client: AsyncClient, test_member: dict):

        member_id = (
            test_member.get("id")
            or test_member.get("member_id")
            or test_member.get("profile_id")
        )
        payload = {
            "post_type": PostType.text.value,
            "title": "My First Post",
            "body": "This is the content of my first post",
            "attributed_to_member_id": member_id,
        }

        response = await auth_client.post(
            "/posts/posts",
            json=payload,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["body"] == payload["body"]
        assert data["post_type"] == payload["post_type"]
        assert "id" in data
        assert "author_id" in data
        assert "created_at" in data
        assert data["media"] == []
        assert data["tags"] == []
        return data["id"]

    @pytest.mark.order(2)
    async def test_create_post_without_title(
        self, auth_client: AsyncClient, test_family: dict
    ):
        response = await auth_client.get(
            f"/profiles/families/{test_family['id']}/members/me",
        )

        assert response.status_code == 200, f"User is not a member: {response.json()}"

        member_profile = response.json()

        member_id = member_profile.get("id") or member_profile.get("member_id")
        assert (
            member_id is not None
        ), f"Member ID not found in profile: {member_profile}"

        payload = {
            "body": "Just a body without title",
            "attributed_to_member_id": member_id,
            "post_type": PostType.text.value,
        }

        response = await auth_client.post("/posts/posts", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data.get("title") is None
        assert data["body"] == "Just a body without title"

    @pytest.mark.order(3)
    async def test_get_post_by_id(self, auth_client: AsyncClient, test_post_id: str):
        response = await auth_client.get(
            f"/posts/posts/{test_post_id}",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_post_id
        assert "title" in data
        assert "body" in data

    @pytest.mark.order(4)
    async def test_get_user_posts(self, auth_client: AsyncClient, test_member: dict):
        user_id = test_member.get("user_id") or test_member.get("user")
        response = await auth_client.get(
            f"/posts/users/{user_id}/posts?skip=0&limit=20",
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "id" in data[0]
            assert "author_id" in data[0]

    @pytest.mark.order(5)
    async def test_get_family_feed(self, auth_client: AsyncClient, test_family: dict):
        response = await auth_client.get(
            f"/posts/families/{test_family['id']}/feed?skip=0&limit=20",
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.order(6)
    async def test_update_post(self, auth_client: AsyncClient, test_post_id: str):
        payload = {
            "title": "Updated Post Title",
            "body": "This content has been updated",
        }

        response = await auth_client.put(
            f"/posts/posts/{test_post_id}",
            json=payload,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["body"] == payload["body"]

    @pytest.mark.order(7)
    async def test_update_post_partial(
        self, auth_client: AsyncClient, test_post_id: str
    ):
        payload = {"title": "Only Title Updated"}

        response = await auth_client.put(
            f"/posts/posts/{test_post_id}",
            json=payload,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Only Title Updated"
        assert data["body"] is not None

    @pytest.mark.order(8)
    async def test_delete_post(self, auth_client: AsyncClient, test_post_id: str):
        response = await auth_client.delete(
            f"/posts/posts/{test_post_id}",
        )

        assert response.status_code == 204

        get_response = await auth_client.get(
            f"/posts/posts/{test_post_id}",
        )
        assert get_response.status_code == 404

    @pytest.mark.order(9)
    async def test_create_post_unauthorized(self, client: AsyncClient):
        payload = {
            "post_type": PostType.text.value,
            "title": "Unauthorized Post",
            "body": "Should not be created",
        }

        response = await client.post("/posts/posts", json=payload)
        assert response.status_code == 401

    @pytest.mark.order(10)
    async def test_update_nonexistent_post(self, auth_client: AsyncClient):
        fake_id = uuid4()
        payload = {"title": "Fake Update"}

        response = await auth_client.put(
            f"/posts/posts/{fake_id}",
            json=payload,
        )

        assert response.status_code == 404
