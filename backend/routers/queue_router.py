"""
Lumina Asset Suite - Queue routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import QueueItemCreate, QueueItem, QueueReorder, Asset
from supabase_client import get_admin_client
from auth import get_current_user

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("")
async def list_queue(current_user: dict = Depends(get_current_user)):
    """Get queue with embedded asset details."""
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        # Fetch queue items first
        q_result = admin.table("queue_items").select("*").eq("user_id", user_id).order("position").execute()
        items = q_result.data or []
        if not items:
            return []
        # Fetch related assets in one go
        asset_ids = list({item["asset_id"] for item in items})
        a_result = admin.table("assets").select("*").in_("id", asset_ids).execute()
        assets_by_id = {a["id"]: a for a in (a_result.data or [])}
        # Attach
        out = []
        for item in items:
            asset_data = assets_by_id.get(item["asset_id"])
            out.append({
                **item,
                "asset": asset_data,
            })
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_to_queue(req: QueueItemCreate, current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        # Verify asset belongs to user
        asset_check = admin.table("assets").select("id").eq("id", req.asset_id).eq("user_id", user_id).execute()
        if not asset_check.data:
            raise HTTPException(status_code=404, detail="Asset not found")

        # Determine position (append at end)
        if req.position is None:
            existing = admin.table("queue_items").select("position").eq("user_id", user_id).order("position", desc=True).limit(1).execute()
            next_pos = (existing.data[0]["position"] + 1) if existing.data else 0
        else:
            next_pos = req.position

        record = {
            "user_id": user_id,
            "asset_id": req.asset_id,
            "position": next_pos,
        }
        result = admin.table("queue_items").insert(record).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Insert failed")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}")
async def remove_from_queue(item_id: str, current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        result = admin.table("queue_items").delete().eq("id", item_id).eq("user_id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Queue item not found")
        return {"message": "Removed", "id": item_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("")
async def clear_queue(current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        admin.table("queue_items").delete().eq("user_id", user_id).execute()
        return {"message": "Queue cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reorder")
async def reorder_queue(req: QueueReorder, current_user: dict = Depends(get_current_user)):
    """Reorder queue: pass list of queue_item IDs in desired order."""
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        for idx, item_id in enumerate(req.item_ids):
            admin.table("queue_items").update({"position": idx}).eq("id", item_id).eq("user_id", user_id).execute()
        return {"message": "Reordered", "count": len(req.item_ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
