"""
Lumina Asset Suite - Main FastAPI app
"""
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Add backend to path so relative imports work
sys.path.insert(0, str(ROOT_DIR))

from routers.auth_router import router as auth_router
from routers.assets_router import router as assets_router
from routers.queue_router import router as queue_router
from routers.history_router import router as history_router

# Create the main app
app = FastAPI(title="Lumina Asset Suite API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Lumina Asset Suite API", "status": "online"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


# Mount sub-routers
api_router.include_router(auth_router)
api_router.include_router(assets_router)
api_router.include_router(queue_router)
api_router.include_router(history_router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.info("Lumina Asset Suite API initialized")
