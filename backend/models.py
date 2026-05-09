"""
Lumina Asset Suite - Pydantic models
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ==================== AUTH ====================
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user_id: str
    email: str
    access_token: str
    refresh_token: Optional[str] = None


# ==================== ASSETS ====================
class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    asset_type: str  # 'video' or 'audio'


class UploadUrlResponse(BaseModel):
    upload_url: str
    public_url: str
    r2_key: str


class AssetCreate(BaseModel):
    title: str
    type: str  # 'video' or 'audio'
    r2_key: str
    public_url: str
    duration: Optional[float] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: Optional[List[str]] = []


class Asset(BaseModel):
    id: str
    user_id: str
    title: str
    type: str
    r2_key: str
    public_url: str
    duration: Optional[float] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AssetUpdate(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    duration: Optional[float] = None


# ==================== QUEUE ====================
class QueueItemCreate(BaseModel):
    asset_id: str
    position: Optional[int] = None


class QueueItem(BaseModel):
    id: str
    user_id: str
    asset_id: str
    position: int
    created_at: Optional[str] = None
    asset: Optional[Asset] = None


class QueueReorder(BaseModel):
    item_ids: List[str]  # ordered list of queue_item ids


# ==================== HISTORY ====================
class HistoryCreate(BaseModel):
    asset_id: Optional[str] = None
    asset_title: str
    asset_type: Optional[str] = None
    duration_played: Optional[float] = None
    source: str = "manual"  # 'manual' | 'autoplay' | 'transition'


class HistoryEntry(BaseModel):
    id: str
    user_id: str
    asset_id: Optional[str] = None
    asset_title: str
    asset_type: Optional[str] = None
    played_at: str
    duration_played: Optional[float] = None
    source: str
