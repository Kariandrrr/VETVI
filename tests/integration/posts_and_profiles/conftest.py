from io import BytesIO

import pytest
from httpx import AsyncClient


@pytest.fixture
async def test_family(auth_client: AsyncClient):
    payload = {"name": "Test Family", "description": "Family for integration testing"}
    response = await auth_client.post("/families/", json=payload)
    family_data = response.json()

    user_response = await auth_client.get("/auth/me")
    user_data = user_response.json()
    user_id = user_data.get("id") or user_data.get("user_id")

    first_name = user_data.get("first_name") or "Test"
    last_name = user_data.get("last_name") or "User"

    add_response = await auth_client.post(
        "/families/members",
        json={
            "family_group_id": family_data["id"],
            "linked_user_id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "role": "admin",
        },
    )

    if add_response.status_code not in (200, 201):
        print(f"Warning: Failed to add user to family: {add_response.json()}")

    return family_data


@pytest.fixture
async def test_member(auth_client: AsyncClient, test_family: dict):
    response = await auth_client.get(
        f"/profiles/families/{test_family['id']}/members/me",
    )
    return response.json()


@pytest.fixture
async def test_post_id(auth_client: AsyncClient, test_member: dict):

    member_id = (
        test_member.get("id")
        or test_member.get("member_id")
        or test_member.get("profile_id")
    )

    payload = {
        "post_type": "text",
        "title": "Test Post",
        "body": "This is a test post for integration tests",
        "attributed_to_member_id": member_id,
    }

    response = await auth_client.post("/posts/posts", json=payload)
    return response.json()["id"]


@pytest.fixture
async def test_tag_id(auth_client: AsyncClient, test_family: dict):
    payload = {"name": "test_tag"}

    response = await auth_client.post(
        f"/tags/families/{test_family['id']}/tags",
        json=payload,
        params={"family_id": test_family["id"]},
    )
    return response.json()["id"]


@pytest.fixture
async def test_media_id(
    auth_client: AsyncClient,
    test_post_id: str,
    test_image_file: BytesIO,
    test_family: dict,
):
    files = {"file": ("test.jpg", test_image_file, "image/jpeg")}

    response = await auth_client.post(
        f"/media/posts/{test_post_id}/media",
        files=files,
        params={"family_id": test_family["id"]},
    )

    print(f"\nUpload media response status: {response.status_code}")
    print(f"Upload media response body: {response.text}")

    if response.status_code == 422:
        error_data = response.json()
        for err in error_data.get("detail", []):
            print(f"Validation error: {err.get('loc')} - {err.get('msg')}")

    assert response.status_code == 201, f"Failed to upload test media: {response.text}"
    data = response.json()
    assert "id" in data, f"No 'id' in response: {data}"

    return data["id"]


@pytest.fixture
def test_image_file() -> BytesIO:
    return BytesIO(b"fake image content")


@pytest.fixture
def test_image_file2() -> BytesIO:
    return BytesIO(b"fake png content")


@pytest.fixture
def large_image_file() -> BytesIO:
    return BytesIO(b"x" * (5 * 1024 * 1024))


@pytest.fixture
def test_text_file() -> BytesIO:
    return BytesIO(b"This is a text file content")


@pytest.fixture(scope="function")
async def auth_client_admin(client: AsyncClient, test_family: dict):
    import uuid

    unique_id = str(uuid.uuid4())[:8]
    admin_data = {
        "email": f"admin_for_family_{unique_id}@example.com",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "display_name": "Admin User",
    }

    register_response = await client.post("/auth/register", json=admin_data)
    assert register_response.status_code in [
        200,
        201,
    ], f"Registration failed: {register_response.text}"

    login_resp = await client.post(
        "/auth/login",
        data={"username": admin_data["email"], "password": admin_data["password"]},
    )

    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]

    client.headers.update({"Authorization": f"Bearer {token}"})

    user_response = await client.get("/auth/me")
    user_data = user_response.json()
    user_id = user_data.get("id")

    add_response = await client.post(
        "/families/members",
        json={
            "family_group_id": test_family["id"],
            "linked_user_id": user_id,
            "first_name": admin_data["first_name"],
            "last_name": admin_data["last_name"],
            "role": "admin",
        },
    )

    if add_response.status_code not in [200, 201]:
        pytest.skip(f"Cannot add admin to family: {add_response.text}")

    yield client
