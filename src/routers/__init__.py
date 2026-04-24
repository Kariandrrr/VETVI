from fastapi import APIRouter

from .log_in import router as log_in_router

router = APIRouter()
router.include_router(log_in_router, tags=["register"])
