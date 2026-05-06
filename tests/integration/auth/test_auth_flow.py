import pytest
from src.core.models.enums import MembershipRole

pytestmark = pytest.mark.asyncio


class TestAuthFlow:

    @pytest.mark.order(1)
    async def test_register_new_user(self, client):
        payload = {
            "email": "new_user@test.com",
            "password": "SecurePassword123!",
            "display_name": "NewUser",
            "role": MembershipRole.viewer.value,
        }
        response = await client.post("/auth/register", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == payload["email"]
        assert data["display_name"] == payload["display_name"]
        assert "id" in data
        assert "hashed_password" not in data

    @pytest.mark.order(2)
    async def test_register_duplicate_username(self, client):
        payload = {
            "email": "unique@test.com",
            "password": "SecurePassword123!",
            "display_name": "DuplicateUser",
        }
        await client.post("/auth/register", json=payload)

        payload2 = payload.copy()
        payload2["email"] = "another@test.com"
        response = await client.post("/auth/register", json=payload2)

        assert response.status_code == 400
        assert "Username already registered" in response.json()["detail"]

    @pytest.mark.order(3)
    async def test_login_success(self, client):
        credentials = {
            "email": "login_user@test.com",
            "password": "SecurePassword123!",
            "display_name": "LoginUser",
        }
        await client.post("/auth/register", json=credentials)

        login_data = {
            "username": credentials["display_name"],
            "password": credentials["password"],
        }
        response = await client.post("/auth/login", data=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "refresh_token" in data

    @pytest.mark.order(4)
    async def test_login_wrong_password(self, client):
        user_data = {
            "email": "wrong_pass@test.com",
            "password": "CorrectPassword123!",
            "display_name": "WrongPassUser",
        }
        await client.post("/auth/register", json=user_data)

        login_data = {
            "username": user_data["display_name"],
            "password": "WrongPassword",
        }
        response = await client.post("/auth/login", data=login_data)

        assert response.status_code == 401

    @pytest.mark.order(5)
    async def test_get_current_user(self, client):
        creds = {
            "email": "me_test@test.com",
            "password": "SecurePassword123!",
            "display_name": "MeUser",
        }
        await client.post("/auth/register", json=creds)

        login_resp = await client.post(
            "/auth/login",
            data={"username": creds["display_name"], "password": creds["password"]},
        )
        token = login_resp.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == creds["email"]
        assert data["display_name"] == creds["display_name"]

    @pytest.mark.order(6)
    async def test_update_user(self, client):
        creds = {
            "email": "update_test@test.com",
            "password": "SecurePassword123!",
            "display_name": "UpdateUser",
        }
        reg_resp = await client.post("/auth/register", json=creds)
        user_id = reg_resp.json()["id"]

        login_resp = await client.post(
            "/auth/login",
            data={"username": creds["display_name"], "password": creds["password"]},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        update_data = {"display_name": "UpdatedName"}
        response = await client.put(
            f"/auth/users/{user_id}", json=update_data, headers=headers
        )

        assert response.status_code == 200
        assert response.json()["display_name"] == "UpdatedName"

    @pytest.mark.order(7)
    async def test_delete_user(self, client):
        creds = {
            "email": "delete_test@test.com",
            "password": "SecurePassword123!",
            "display_name": "DeleteUser",
        }
        reg_resp = await client.post("/auth/register", json=creds)
        user_id = reg_resp.json()["id"]

        login_resp = await client.post(
            "/auth/login",
            data={"username": creds["display_name"], "password": creds["password"]},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.delete(f"/auth/users/{user_id}", headers=headers)

        assert response.status_code == 200

        me_response = await client.get("/auth/me", headers=headers)
        assert me_response.status_code == 401
