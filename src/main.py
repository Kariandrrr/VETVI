import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.models import db_helper
from .routers import log_in_router, invitations_router, families_router, join_router

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    print("dispose engine")
    await db_helper.db_helper.dispose()


app = FastAPI(
    lifespan=lifespan,
    title="***",
    description="***",
    docs_url="/docs",
    redoc_url="/redoc",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.run.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Set-Cookie", "Authorization"],
)


app.include_router(log_in_router, prefix="/auth", tags=["register"])
app.include_router(families_router, prefix="/families", tags=["families"])
app.include_router(invitations_router, prefix="/families", tags=["invitations"])
app.include_router(join_router, tags=["join"])


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app", reload=True, host=settings.run.host, port=settings.run.port
    )
