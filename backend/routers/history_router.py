"""
Lumina Asset Suite - History routes
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from models import HistoryCreate, HistoryEntry
from supabase_client import get_admin_client
from auth import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.post("", response_model=HistoryEntry)
async def add_history(entry: HistoryCreate, current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    record = {
        "user_id": user_id,
        "asset_id": entry.asset_id,
        "asset_title": entry.asset_title,
        "asset_type": entry.asset_type,
        "duration_played": entry.duration_played,
        "source": entry.source,
    }
    try:
        result = admin.table("history").insert(record).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Insert failed")
        return HistoryEntry(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[HistoryEntry])
async def list_history(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=100, ge=1, le=500),
):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        result = (
            admin.table("history")
            .select("*")
            .eq("user_id", user_id)
            .order("played_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [HistoryEntry(**row) for row in (result.data or [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("")
async def clear_history(current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        admin.table("history").delete().eq("user_id", user_id).execute()
        return {"message": "History cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
