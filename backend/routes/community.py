"""
SmartFarm AI - Community Route
Endpoints for:
  - Discovering global registered SmartFarm AI community members
  - Reading the shared global community post feed
  - Publishing new community posts
  - Liking / unliking posts
  - Commenting on community posts
  - Deleting own community posts
Ensures multi-user integration: posts and members represent real authenticated accounts.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, desc, func

from database.session import get_db
from database.models import User, CommunityPostRecord, CommunityCommentRecord, CommunityLikeRecord
from services.supabase_auth_service import supabase_auth_service

router = APIRouter(prefix="/community", tags=["Community"])
security = HTTPBearer(auto_error=False)


# --- Dependency: Authentication Extraction ---

async def get_optional_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Extracts authenticated user_id if valid Bearer token provided, otherwise returns None."""
    if not credentials or not credentials.credentials:
        return None
    token = credentials.credentials
    payload = supabase_auth_service.decode_access_token(token)
    if payload and "sub" in payload:
        return str(payload["sub"])
    return None


async def get_required_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """Extracts authenticated user_id or raises 401 Unauthorized."""
    user_id = await get_optional_user_id(credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to perform this action in Community.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


# --- Pydantic Schemas ---

class CreatePostRequest(BaseModel):
    crop: str = Field(default="Tomato", max_length=50)
    topic: str = Field(default="Discussion", max_length=100)
    language: str = Field(default="en", max_length=10)
    content: str = Field(..., min_length=1, max_length=3000)


class CreateCommentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


# --- Endpoints ---

@router.get("/members", response_model=List[Dict[str, Any]])
async def get_community_members(
    db: Session = Depends(get_db)
):
    """
    Retrieves the global directory of registered SmartFarm AI community members.
    Returns real user profiles (name, location, crops, registration date) without exposing sensitive data.
    """
    stmt = (
        select(User)
        .where(User.name.isnot(None))
        .order_by(User.created_at.asc())
    )
    users = db.execute(stmt).scalars().all()

    members = []
    for u in users:
        # Avoid showing placeholder, test or internal service accounts
        if u.user_id.startswith("00000000-0000-4000-a000") or u.user_id.startswith("USR-"):
            continue
        
        display_name = u.name.strip() if u.name else "Farmer"
        if not display_name or display_name.lower() == "farmer":
            # Derive from email if present
            if u.email and "@" in u.email:
                display_name = u.email.split("@")[0].capitalize()

        farm_details = u.farm_details or {}
        crops = farm_details.get("primary_crops", ["Tomato", "Potato", "Brinjal"])

        members.append({
            "id": u.user_id or u.id,
            "user_id": u.user_id or u.id,
            "name": display_name,
            "display_name": display_name,
            "location": u.farm_location or "Tamil Nadu, India",
            "farm_location": u.farm_location or "Tamil Nadu, India",
            "farm_area": farm_details.get("farm_area", "3.5 Acres"),
            "primary_crops": crops,
            "preferred_language": u.preferred_language or "en",
            "member_since": u.created_at.isoformat() if u.created_at else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })

    return members


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
@router.get("/posts", response_model=List[Dict[str, Any]])
async def get_community_posts(
    crop: Optional[str] = None,
    lang: Optional[str] = None,
    search: Optional[str] = None,
    current_user_id: Optional[str] = Depends(get_optional_user_id),
    db: Session = Depends(get_db)
):
    """
    Retrieves the global shared community discussion feed.
    Joins real author names, real avatars, comments, like counts, and timestamps.
    """
    stmt = (
        select(CommunityPostRecord)
        .options(
            selectinload(CommunityPostRecord.user),
            selectinload(CommunityPostRecord.comments).selectinload(CommunityCommentRecord.user),
            selectinload(CommunityPostRecord.likes)
        )
        .order_by(desc(CommunityPostRecord.created_at))
    )

    if crop and crop.lower() != "all":
        stmt = stmt.where(func.lower(CommunityPostRecord.crop) == crop.lower())

    if lang and lang.lower() != "all":
        stmt = stmt.where(CommunityPostRecord.language == lang)

    posts = db.execute(stmt).scalars().all()

    result = []
    for p in posts:
        post_dict = p.to_dict(current_user_id=current_user_id)
        
        # Apply optional text search in Python or SQL
        if search:
            q = search.lower()
            if (
                q not in post_dict["content"].lower()
                and q not in post_dict["farmerName"].lower()
                and q not in post_dict["topic"].lower()
            ):
                continue
                
        result.append(post_dict)

    return result


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/posts", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_community_post(
    payload: CreatePostRequest,
    current_user_id: str = Depends(get_required_user_id),
    db: Session = Depends(get_db)
):
    """
    Publishes a new community discussion post authored by the authenticated farmer.
    Guarantees that the author's real display name and created_at timestamp are persisted.
    """
    # Verify user exists in public.users, if not create record
    user = db.execute(select(User).where(User.user_id == current_user_id)).scalar_one_or_none()
    if not user:
        user = User(
            id=current_user_id,
            user_id=current_user_id,
            email=f"{current_user_id}@smartfarm.user",
            name="Farmer",
            preferred_language=payload.language
        )
        db.add(user)
        db.flush()

    new_post = CommunityPostRecord(
        id=str(uuid.uuid4()),
        user_id=current_user_id,
        crop=payload.crop,
        topic=payload.topic,
        language=payload.language,
        content=payload.content.strip(),
        likes_count=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Reload relationships for clean response
    stmt = (
        select(CommunityPostRecord)
        .where(CommunityPostRecord.id == new_post.id)
        .options(
            selectinload(CommunityPostRecord.user),
            selectinload(CommunityPostRecord.comments),
            selectinload(CommunityPostRecord.likes)
        )
    )
    loaded = db.execute(stmt).scalar_one()
    return loaded.to_dict(current_user_id=current_user_id)


@router.delete("/posts/{post_id}", status_code=status.HTTP_200_OK)
async def delete_community_post(
    post_id: str,
    current_user_id: str = Depends(get_required_user_id),
    db: Session = Depends(get_db)
):
    """Deletes a community post. Only the original author is permitted to delete."""
    post = db.execute(select(CommunityPostRecord).where(CommunityPostRecord.id == post_id)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    if post.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts.")

    db.delete(post)
    db.commit()
    return {"status": "success", "message": "Post deleted successfully."}


@router.post("/posts/{post_id}/like", response_model=Dict[str, Any])
async def toggle_post_like(
    post_id: str,
    current_user_id: str = Depends(get_required_user_id),
    db: Session = Depends(get_db)
):
    """
    Toggles a like on a post for the authenticated user.
    Prevents duplicate likes: clicking again removes the like.
    """
    post = db.execute(select(CommunityPostRecord).where(CommunityPostRecord.id == post_id)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    existing_like = db.execute(
        select(CommunityLikeRecord).where(
            CommunityLikeRecord.post_id == post_id,
            CommunityLikeRecord.user_id == current_user_id
        )
    ).scalar_one_or_none()

    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        has_liked = False
    else:
        new_like = CommunityLikeRecord(
            id=str(uuid.uuid4()),
            post_id=post_id,
            user_id=current_user_id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_like)
        post.likes_count = post.likes_count + 1
        has_liked = True

    db.commit()
    return {"status": "success", "likes": post.likes_count, "has_liked": has_liked}


@router.post("/posts/{post_id}/comments", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def add_post_comment(
    post_id: str,
    payload: CreateCommentRequest,
    current_user_id: str = Depends(get_required_user_id),
    db: Session = Depends(get_db)
):
    """Adds a reply / comment to an existing community post."""
    post = db.execute(select(CommunityPostRecord).where(CommunityPostRecord.id == post_id)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    comment = CommunityCommentRecord(
        id=str(uuid.uuid4()),
        post_id=post_id,
        user_id=current_user_id,
        content=payload.content.strip(),
        created_at=datetime.now(timezone.utc)
    )
    db.add(comment)
    db.commit()

    # Fetch with user
    stmt = (
        select(CommunityCommentRecord)
        .where(CommunityCommentRecord.id == comment.id)
        .options(selectinload(CommunityCommentRecord.user))
    )
    loaded = db.execute(stmt).scalar_one()
    return loaded.to_dict()
