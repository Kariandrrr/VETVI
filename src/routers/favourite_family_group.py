from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.models.db_helper import get_db
from ..core.models.users import User
from ..deps.user import get_current_user

router = APIRouter()


@router.get("/favourite")
async def get_favourite_family(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        query = text("""
                     SELECT
                         fg.id::text as id,
                         fg.name,
                         fg.description,
                         fg.created_by::text as created_by,
                         fg.created_at,
                         fg.updated_at
                     FROM family_memberships fm
                              JOIN family_groups fg ON fm.family_group_id = fg.id
                     WHERE fm.user_id = :user_id AND fm.is_favourite = true
                     LIMIT 1
                     """)

        result = await db.execute(query, {"user_id": current_user.id})
        row = result.first()

        if not row:
            raise HTTPException(status_code=404, detail="No favourite family set")

        return {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "created_by": row[3],
            "created_at": row[4].isoformat() if row[4] else None,
            "updated_at": row[5].isoformat() if row[5] else None,
            "memberships": [],
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/favourite/unset", status_code=200)
async def unset_fav_family(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        text(
            "UPDATE family_memberships SET is_favourite = false WHERE user_id = :user_id"
        ),
        {"user_id": current_user.id},
    )
    await db.commit()
    return {"status": "success"}


@router.patch("/{family_id}/favourite", status_code=200)
async def set_fav_family(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        text(
            "UPDATE family_memberships SET is_favourite = false WHERE user_id = :user_id"
        ),
        {"user_id": current_user.id},
    )

    result = await db.execute(
        text(
            "UPDATE family_memberships SET is_favourite = true WHERE user_id = :user_id AND family_group_id = :family_id RETURNING id"
        ),
        {"user_id": current_user.id, "family_id": family_id},
    )

    if not result.first():
        raise HTTPException(
            status_code=404, detail="You are not a member of this family group"
        )

    await db.commit()
    return {"status": "success"}
