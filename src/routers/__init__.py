from fastapi import APIRouter

from .families import router as families_router
from .invitations import router as invitations_router
from .join import router as join_router
from .log_in import router as log_in_router
from .members.members import router as members_router
from .members.relationships import router as members_relationships_router
from .favourite_family_group import router as favourite_family_group_router

from .posts_and_profiles.media import router as posts_and_profiles_media_router
from .posts_and_profiles.posts import router as posts_and_profiles_posts_router
from .posts_and_profiles.profiles import router as posts_and_profiles_profiles_router
from .posts_and_profiles.reactions import router as posts_and_profiles_reactions_router
from .posts_and_profiles.tags import router as posts_and_profiles_tags_router
from .posts_and_profiles.ws_media import router as posts_and_profiles_ws_media_router

router = APIRouter()

router.include_router(log_in_router, prefix="/auth", tags=["register"])
router.include_router(families_router, prefix="/families", tags=["families"])
router.include_router(invitations_router, prefix="/families", tags=["invitations"])
router.include_router(join_router, prefix="/join", tags=["join"])
router.include_router(members_router, prefix="/families", tags=["members"])
router.include_router(
    members_relationships_router, prefix="/families", tags=["relationships"]
)
router.include_router(
    favourite_family_group_router, prefix="/families", tags=["favourite"]
)

# posts_and_profiles
router.include_router(posts_and_profiles_media_router, prefix="/media", tags=["posts"])
router.include_router(posts_and_profiles_posts_router, prefix="/posts", tags=["posts"])
router.include_router(
    posts_and_profiles_profiles_router, prefix="/profiles", tags=["profiles"]
)
router.include_router(
    posts_and_profiles_reactions_router, prefix="/reactions", tags=["posts"]
)
router.include_router(posts_and_profiles_tags_router, prefix="/tags", tags=["posts"])
router.include_router(posts_and_profiles_ws_media_router)
