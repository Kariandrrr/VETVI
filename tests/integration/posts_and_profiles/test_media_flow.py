from io import BytesIO
from uuid import uuid4

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestMediaFlow:

    @pytest.mark.order(1)
    async def test_upload_media_to_post(
        self,
        auth_client: AsyncClient,
        test_post_id: str,
        test_image_file: BytesIO,
        test_family,
    ):
        files = {"file": ("test_image.jpg", test_image_file, "image/jpeg")}

        response = await auth_client.post(
            f"/media/posts/{test_post_id}/media",
            files=files,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["post_id"] == test_post_id
        assert data["original_name"] == "test_image.jpg"
        assert data["mime_type"] == "image/jpeg"
        assert "id" in data
        assert "stored_name" in data
        assert "file_size_bytes" in data

        return data["id"]

    @pytest.mark.order(2)
    async def test_upload_multiple_media_to_post(
        self,
        auth_client: AsyncClient,
        test_post_id: str,
        test_image_file: BytesIO,
        test_image_file2: BytesIO,
        test_family,
    ):
        files1 = {"file": ("image1.jpg", test_image_file, "image/jpeg")}
        response1 = await auth_client.post(
            f"/media/posts/{test_post_id}/media",
            files=files1,
            params={"family_id": test_family["id"]},
        )
        assert response1.status_code == 201

        files2 = {"file": ("image2.png", test_image_file2, "image/png")}
        response2 = await auth_client.post(
            f"/media/posts/{test_post_id}/media",
            files=files2,
            params={"family_id": test_family["id"]},
        )
        assert response2.status_code == 201

        post_response = await auth_client.get(f"/posts/posts/{test_post_id}")
        assert post_response.status_code == 200
        post_data = post_response.json()
        assert len(post_data.get("media", [])) >= 2

    @pytest.mark.order(3)
    async def test_stream_media(
        self, auth_client: AsyncClient, test_media_id: str, test_family
    ):
        response = await auth_client.get(
            f"/media/media/{test_media_id}/stream",
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert (
            content_type.startswith("image/")
            or content_type == "application/octet-stream"
        )
        assert "content-length" in response.headers

    @pytest.mark.order(4)
    async def test_upload_media_to_nonexistent_post(
        self, auth_client: AsyncClient, test_image_file: BytesIO, test_family
    ):
        fake_id = uuid4()
        files = {"file": ("test.jpg", test_image_file, "image/jpeg")}

        response = await auth_client.post(
            f"/media/posts/{fake_id}/media",
            files=files,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 404

    @pytest.mark.order(5)
    async def test_stream_nonexistent_media(
        self, auth_client: AsyncClient, test_family
    ):
        fake_id = uuid4()

        response = await auth_client.get(
            f"/media/media/{fake_id}/stream",
            params={"family_id": test_family["id"]},
        )

        assert response.status_code == 404

    @pytest.mark.order(6)
    async def test_upload_media_unauthorized(
        self,
        client: AsyncClient,
        test_post_id: str,
        test_image_file: BytesIO,
        test_family,
    ):
        client.headers.pop("Authorization", None)

        files = {"file": ("test.jpg", test_image_file, "image/jpeg")}

        response = await client.post(
            f"/media/posts/{test_post_id}/media",
            files=files,
            params={"family_id": test_family["id"]},
        )
        assert response.status_code == 401

    @pytest.mark.order(7)
    async def test_stream_media_unauthorized(
        self, client: AsyncClient, test_media_id: str, test_family
    ):
        client.headers.pop("Authorization", None)

        response = await client.get(
            f"/media/media/{test_media_id}/stream",
            params={"family_id": test_family["id"]},
        )
        assert response.status_code == 401

    @pytest.mark.order(8)
    async def test_upload_media_large_file(
        self,
        auth_client: AsyncClient,
        test_post_id: str,
        large_image_file: BytesIO,
        test_family,
    ):
        files = {"file": ("large_image.jpg", large_image_file, "image/jpeg")}

        response = await auth_client.post(
            f"/media/posts/{test_post_id}/media",
            files=files,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code in [201, 400, 413]

        if response.status_code == 400:
            error_data = response.json()
            assert (
                "size" in str(error_data).lower() or "large" in str(error_data).lower()
            )

    @pytest.mark.order(9)
    async def test_upload_invalid_file_type(
        self,
        auth_client: AsyncClient,
        test_post_id: str,
        test_text_file: BytesIO,
        test_family,
    ):
        files = {"file": ("document.txt", test_text_file, "text/plain")}

        response = await auth_client.post(
            f"/media/posts/{test_post_id}/media",
            files=files,
            params={"family_id": test_family["id"]},
        )

        assert response.status_code in [400, 415, 422]

        if response.status_code in [400, 422, 415]:
            error_data = response.json()
            assert (
                "file" in str(error_data).lower() or "type" in str(error_data).lower()
            )
