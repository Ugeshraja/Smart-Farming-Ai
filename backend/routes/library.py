"""
SmartFarm AI - Agriculture Library Route
Endpoints for browsing and searching verified TNAU & ICAR agricultural guides.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query
from services.library_service import library_service

router = APIRouter(prefix="/library", tags=["Agriculture Library"])


@router.get("/categories")
async def get_library_categories():
    """Retrieve all available knowledge base categories with document counts."""
    return library_service.get_categories()


@router.get("/articles")
async def get_library_articles(
    query: Optional[str] = Query("", description="Search term or phrase"),
    cropId: Optional[str] = Query("all", description="Crop filter ('all', 'tomato', 'potato', 'brinjal')"),
    category: Optional[str] = Query("all", description="Topic category filter")
):
    """
    Filter and search verified agricultural guides and articles.
    Returns array of article objects matching the filters.
    """
    return library_service.filter_articles(
        query=query or "",
        crop_id=cropId or "all",
        category=category or "all"
    )


@router.get("")
@router.get("/")
async def get_library_root(
    query: Optional[str] = Query("", description="Search term or phrase"),
    cropId: Optional[str] = Query("all", description="Crop filter ('all', 'tomato', 'potato', 'brinjal')"),
    category: Optional[str] = Query("all", description="Topic category filter")
):
    """Compatibility alias for /api/library."""
    return library_service.filter_articles(
        query=query or "",
        crop_id=cropId or "all",
        category=category or "all"
    )
