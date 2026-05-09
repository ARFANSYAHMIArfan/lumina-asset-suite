"""
Lumina Asset Suite - Asset routes (Library)
"""
import uuid
import os
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import (
    UploadUrlRequest, UploadUrlResponse,
    AssetCreate, Asset, AssetUpdate,
)
from supabase_client import get_admin_client
from r2_client import generate_presigned_put, public_url_for, delete_object
from auth import get_current_user

router = APIRouter(prefix="/assets", tags=["assets"])


def _safe_filename(filename: str) -> str:
    base = os.path.basename(filename)
    return ''.join(c if c.isalnum() or c in '._-' else '_' for c in base)[:100]


@router.post("/upload-url", response_model=UploadUrlResponse)
async def request_upload_url(req: UploadUrlRequest, current_user: dict = Depends(get_current_user)):
    """Generate a presigned PUT URL for direct browser upload to R2."""
    if req.asset_type not in ('video', 'audio'):
        raise HTTPException(status_code=400, detail="asset_type must be 'video' or 'audio'")
    user_id = current_user["id"]
    safe_name = _safe_filename(req.filename) or 'file'
    key = f"users/{user_id}/{uuid.uuid4()}_{safe_name}"
    try:
        upload_url = generate_presigned_put(key, req.content_type)
        return UploadUrlResponse(
            upload_url=upload_url,
            public_url=public_url_for(key),
            r2_key=key,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {e}")


@router.post("", response_model=Asset)
async def create_asset(asset: AssetCreate, current_user: dict = Depends(get_current_user)):
    """Create asset metadata after upload to R2."""
    if asset.type not in ('video', 'audio'):
        raise HTTPException(status_code=400, detail="type must be 'video' or 'audio'")
    admin = get_admin_client()
    user_id = current_user["id"]
    record = {
        "user_id": user_id,
        "title": asset.title,
        "type": asset.type,
        "r2_key": asset.r2_key,
        "public_url": asset.public_url,
        "duration": asset.duration,
        "file_size": asset.file_size,
        "mime_type": asset.mime_type,
        "thumbnail_url": asset.thumbnail_url,
        "tags": asset.tags or [],
    }
    try:
        result = admin.table("assets").insert(record).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Insert returned no data")
        return Asset(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[Asset])
async def list_assets(current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        result = admin.table("assets").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return [Asset(**row) for row in (result.data or [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str, current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        result = admin.table("assets").select("*").eq("id", asset_id).eq("user_id", user_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Asset not found")
        return Asset(**result.data)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Asset not found")


@router.patch("/{asset_id}", response_model=Asset)
async def update_asset(asset_id: str, update: AssetUpdate, current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    payload = {k: v for k, v in update.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        result = admin.table("assets").update(payload).eq("id", asset_id).eq("user_id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Asset not found")
        return Asset(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str, current_user: dict = Depends(get_current_user)):
    admin = get_admin_client()
    user_id = current_user["id"]
    try:
        # First fetch the asset to get r2_key
        fetch = admin.table("assets").select("r2_key").eq("id", asset_id).eq("user_id", user_id).execute()
        if not fetch.data:
            raise HTTPException(status_code=404, detail="Asset not found")
        r2_key = fetch.data[0]["r2_key"]
        # Delete DB row (queue items cascaded automatically)
        admin.table("assets").delete().eq("id", asset_id).eq("user_id", user_id).execute()
        # Best-effort R2 delete
        try:
            delete_object(r2_key)
        except Exception:
            pass
        return {"message": "Asset deleted", "id": asset_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
