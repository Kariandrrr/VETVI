import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.core.models.db_helper import engine as global_engine
from src.core.models.db_helper import get_db
from src.main import app


@pytest.fixture(scope="function")
async def db_session():
    async_session = async_sessionmaker(
        bind=global_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        try:
            yield session
        finally:
            await session.rollback()


@pytest.fixture(scope="function")
async def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def auth_client(client):
    user_data = {
        "email": "test_user@example.com",
        "password": "strongpassword123",
        "display_name": "Tester",
    }

    await client.post("/auth/register", json=user_data)

    login_resp = await client.post(
        "/auth/login",
        data={"username": user_data["email"], "password": user_data["password"]},
    )
    token = login_resp.json()["access_token"]

    client.headers.update({"Authorization": f"Bearer {token}"})

    yield client
