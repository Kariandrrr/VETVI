import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import settings
from .core.models import db_helper
from .routers import router

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
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = Path("uploads")
if uploads_path.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app", reload=True, host=settings.run.host, port=settings.run.port
    )
