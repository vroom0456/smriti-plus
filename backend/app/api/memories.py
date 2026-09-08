"""
SMRITI+ — Digital Memory Box API Router

Implements Sections 35, 36 & Phase 2 Requirements:
- GET /elders/{elder_id}/memories — list curated memories
- POST /elders/{elder_id}/memories — add photo/story/audio memory
- PATCH /memories/{memory_id} — update memory
- DELETE /memories/{memory_id} — remove memory
"""

from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import MemoryItem, AuditLog
from app.core.auth import get_current_user, CurrentUser, verify_elder_access
from app.api.schemas import (
    MemoryItemCreate,
    MemoryItemUpdate,
    MemoryItemResponse,
)

router = APIRouter(tags=["Digital Memory Box"])


@router.get("/elders/{elder_id}/memories", response_model=List[MemoryItemResponse])
def get_memory_items(
    elder_id: UUID,
    category: Optional[str] = Query(None, description="Optional category filter"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Retrieve memory items for the elder, optionally filtered by category."""
    verify_elder_access(elder_id, current_user, db)

    query = db.query(MemoryItem).filter(MemoryItem.elderly_id == elder_id)
    if category and category.lower() != "all":
        query = query.filter(MemoryItem.category == category)

    items = query.order_by(MemoryItem.created_at.desc()).all()
    return items


@router.post("/elders/{elder_id}/memories", response_model=MemoryItemResponse, status_code=status.HTTP_201_CREATED)
def add_memory_item(
    elder_id: UUID,
    req: MemoryItemCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Add a new memory item (photo, audio, story, person, place, music) with culturally respectful context."""
    verify_elder_access(elder_id, current_user, db)

    item = MemoryItem(
        elderly_id=elder_id,
        type=req.type,
        title=req.title,
        description=req.description,
        media_url=req.media_url,
        thumbnail_url=req.thumbnail_url,
        category=req.category,
        created_by=current_user.user_id,
    )
    db.add(item)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="create_memory_item",
        target_id=item.id,
        details={"elder_id": str(elder_id), "title": req.title, "type": req.type, "category": req.category},
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/memories/{memory_id}", response_model=MemoryItemResponse)
def update_memory_item(
    memory_id: UUID,
    req: MemoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update memory item title, description, or media."""
    item = db.query(MemoryItem).filter(MemoryItem.id == memory_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory item not found")

    verify_elder_access(item.elderly_id, current_user, db)

    if req.title is not None:
        item.title = req.title
    if req.description is not None:
        item.description = req.description
    if req.media_url is not None:
        item.media_url = req.media_url
    if req.thumbnail_url is not None:
        item.thumbnail_url = req.thumbnail_url
    if req.category is not None:
        item.category = req.category

    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/memories/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_item(
    memory_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a memory item."""
    item = db.query(MemoryItem).filter(MemoryItem.id == memory_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory item not found")

    verify_elder_access(item.elderly_id, current_user, db)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="delete_memory_item",
        target_id=memory_id,
        details={"elder_id": str(item.elderly_id), "title": item.title},
    )
    db.add(audit)
    db.delete(item)
    db.commit()
    return None
