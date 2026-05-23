import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from urllib.parse import quote_plus

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
)

from src.core.config import settings

log = logging.getLogger(__name__)


class DBHelper:
    def __init__(
        self,
        url: str,
        echo: bool = False,
        echo_pool: bool = False,
        pool_size: int | None = None,
        max_overflow: int | None = None,
    ) -> None:

        kwargs = {
            "echo": echo,
            "echo_pool": echo_pool,
            "pool_pre_ping": True,
        }

        if pool_size is not None:
            kwargs["pool_size"] = pool_size
        if max_overflow is not None:
            kwargs["max_overflow"] = max_overflow

        kwargs["pool_recycle"] = 3600

        self.engine: AsyncEngine = create_async_engine(url=url, **kwargs)

        self.session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
            bind=self.engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )

    async def dispose(self) -> None:
        await self.engine.dispose()

    async def check_connection(self) -> bool:
        try:
            async with self.engine.connect() as conn:
                await conn.execute("SELECT 1")
            return True
        except Exception as e:
            log.error(f"Database connection check failed: {e}")
            return False

    @asynccontextmanager
    async def session_getter(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.session_factory() as session:
            yield session


db_url: str = settings.db.url

safe_url = db_url
if settings.db.password and settings.db.password in db_url:
    safe_url = db_url.replace(str(settings.db.password), "****")
log.info("Database URL: %s", safe_url)


engine_kwargs = {
    "url": settings.db.url,
    "echo": settings.db.echo,
    "echo_pool": settings.db.echo_pool,
}

if "sqlite" not in settings.db.url:
    engine_kwargs.update(
        {
            "pool_size": settings.db.pool_size,
            "max_overflow": settings.db.max_overflow,
        }
    )

db_helper: DBHelper = DBHelper(**engine_kwargs)


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    async with db_helper.session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session: AsyncSession = db_helper.session_factory()
    try:
        yield session
    finally:
        await session.close()


engine = db_helper.engine
