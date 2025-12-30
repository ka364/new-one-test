"""
API Router - Main router for all endpoints
"""

from fastapi import APIRouter

from backend.api.v1.endpoints import (
    auth,
    sharia,
    investments,
    blockchain,
    ai_models,
    bio_modules,
    security,
    products
)

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    sharia.router,
    prefix="/sharia",
    tags=["sharia-compliance"]
)

api_router.include_router(
    investments.router,
    prefix="/investments",
    tags=["investments"]
)

api_router.include_router(
    blockchain.router,
    prefix="/blockchain",
    tags=["blockchain"]
)

api_router.include_router(
    ai_models.router,
    prefix="/ai",
    tags=["ai-models"]
)

api_router.include_router(
    bio_modules.router,
    prefix="/bio-modules",
    tags=["bio-modules"]
)

api_router.include_router(
    security.router,
    prefix="/security",
    tags=["security"]
)

api_router.include_router(
    products.router,
    prefix="/products",
    tags=["products"]
)
