import pytest

from src.core.config import settings
from src.core.models.base import Base
from src.core.models.db_helper import engine


@pytest.fixture(scope="session", autouse=True)
async def setup():
    async with engine.begin() as conn:
        print(f"🔍 DB mode: {settings.db.mode}")
        print(f"🔍 DB url: {settings.db.url}")

        assert settings.db.mode == "TEST", f"Expected TEST mode, got {settings.db.mode}"

        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
