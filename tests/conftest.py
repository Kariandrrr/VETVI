from unittest.mock import patch
import pytest
from src.core.config import settings
from src.core.models.base import Base
from src.core.models.db_helper import engine


@pytest.fixture(scope="session", autouse=True)
def setup():
    print(f"🔍 DB mode: {settings.db.mode}")
    print(f"🔍 DB url: {settings.db.url}")

    assert settings.db.mode == "TEST", f"Expected TEST mode, got {settings.db.mode}"

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
