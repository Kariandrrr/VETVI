from fastapi import APIRouter

from .log_in import router as log_in_router
from .families import router as families_router
from .invitations import router as invitations_router

router = APIRouter()

router.include_router(log_in_router, prefix="/auth", tags=["register"])
router.include_router(families_router, prefix="/families", tags=["families"])
router.include_router(invitations_router, prefix="/invitations", tags=["invitations"])
