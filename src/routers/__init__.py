from fastapi import APIRouter

from .families import router as families_router
from .invitations import router as invitations_router
from .join import router as join_router
from .log_in import router as log_in_router
from .members.members import router as members_router
from .members.relationships import router as members_relationships_router

router = APIRouter()

router.include_router(log_in_router)
router.include_router(families_router)
router.include_router(invitations_router)
router.include_router(join_router)
router.include_router(members_relationships_router)
router.include_router(members_router)
