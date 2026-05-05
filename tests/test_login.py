import pytest
from httpx import AsyncClient, ASGITransport

from src.core.models.db_helper import db_helper
from src.core.schemas.user import UserCreate
from src.crud.user import create_user
from src.main import app


@pytest.mark.asyncio
async def test_full_auth_cycle():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        async with db_helper.session_factory() as session:
            user_in = UserCreate(
                display_name="test_user", email="test@example.cmo", password="testpswr"
            )
            try:
                await create_user(session, user_in)
            except Exception:
                pass

        # LOGIN
        login_data = {"username": "test_user", "password": "testpswr"}
        response = await ac.post("/auth/login", data=login_data)
        assert response.status_code == 200

        data = response.json()

        assert "access_token" in data
        assert data["refresh_token"] == "stored_in_cookie"
        assert "refresh_token" in ac.cookies

        # /ME
        headers = {"Authorization": f"Bearer {data['access_token']}"}
        me_res = await ac.get("/auth/me", headers=headers)
        assert me_res.status_code == 200

        # REFRESH
        refresh_res = await ac.post("/auth/refresh")
        assert refresh_res.status_code == 200
        assert "access_token" in refresh_res.json()
