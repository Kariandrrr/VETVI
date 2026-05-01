from fastapi import APIRouter

from .log_in import router as log_in_router
from .families import router as families_router
from .invitations import router as invitations_router
from .join import router as join_router

router = APIRouter()

router.include_router(log_in_router)
router.include_router(families_router)
router.include_router(invitations_router)
router.include_router(join_router)
