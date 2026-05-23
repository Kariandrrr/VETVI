from uuid import uuid4

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestTagsFlow:

    @pytest.mark.order(1)
    async def test_create_tag(self, auth_client: AsyncClient, test_family: dict):
        payload = {"name": "vacation"}

        response = await auth_client.post(
            f"/tags/families/{test_family['id']}/tags",
            json=payload,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["family_group_id"] == test_family["id"]
        assert "id" in data

        return data["id"]

    @pytest.mark.order(2)
    async def test_get_family_tags(self, auth_client: AsyncClient, test_family: dict):
        response = await auth_client.get(
            f"/tags/families/{test_family['id']}/tags",
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "id" in data[0]
            assert "name" in data[0]
            assert data[0]["family_group_id"] == test_family["id"]

    @pytest.mark.order(3)
    async def test_update_tag(
        self, auth_client: AsyncClient, test_family: dict, test_tag_id: str
    ):
        payload = {"name": "holidays_updated"}

        response = await auth_client.put(
            f"/tags/families/{test_family['id']}/tags/{test_tag_id}",
            json=payload,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["id"] == test_tag_id

    @pytest.mark.order(4)
    async def test_attach_tags_to_post(
        self,
        auth_client: AsyncClient,
        test_family: dict,
        test_post_id: str,
        test_tag_id: str,
    ):
        payload = [test_tag_id]

        response = await auth_client.post(
            f"/tags/families/{test_family['id']}/posts/{test_post_id}/tags",
            json=payload,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 200
        data = response.json()
        assert data is not None
        if isinstance(data, dict) and "attached" in data:
            assert data["attached"] == 1 or data["attached"] == len(payload)

    @pytest.mark.order(5)
    async def test_attach_multiple_tags_to_post(
        self, auth_client: AsyncClient, test_family: dict, test_post_id: str
    ):
        tag_names = ["family", "history", "photo"]
        tag_ids = []

        for name in tag_names:
            response = await auth_client.post(
                f"/tags/families/{test_family['id']}/tags",
                json={"name": name},
                params={"family_id": test_family["id"]},
            )
            assert response.status_code == 201, f"Failed to create tag {name}"
            tag_ids.append(response.json()["id"])

        response = await auth_client.post(
            f"/tags/families/{test_family['id']}/posts/{test_post_id}/tags",
            json=tag_ids,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 200
        data = response.json()
        assert data is not None
        if isinstance(data, dict) and "attached" in data:
            assert data["attached"] == len(tag_ids)

    @pytest.mark.order(6)
    async def test_attach_tags_to_nonexistent_post(
        self, auth_client: AsyncClient, test_family: dict, test_tag_id: str
    ):
        fake_id = uuid4()
        payload = [test_tag_id]

        response = await auth_client.post(
            f"/tags/families/{test_family['id']}/posts/{fake_id}/tags",
            json=payload,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 404

    @pytest.mark.order(7)
    async def test_create_tag_unauthorized(
        self, client: AsyncClient, test_family: dict
    ):
        client.headers.pop("Authorization", None)

        payload = {"name": "unauthorized_tag"}

        response = await client.post(
            f"/tags/families/{test_family['id']}/tags",
            json=payload,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 401

    @pytest.mark.order(8)
    async def test_update_nonexistent_tag(
        self, auth_client: AsyncClient, test_family: dict
    ):
        fake_id = uuid4()
        payload = {"name": "no_such_tag"}

        response = await auth_client.put(
            f"/tags/families/{test_family['id']}/tags/{fake_id}",
            json=payload,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 404
