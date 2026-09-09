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
from app.db.models import MemoryItem, AuditLog, PatientIdentityStory, User
from app.core.auth import get_current_user, CurrentUser, verify_elder_access
from app.api.schemas import (
    MemoryItemCreate,
    MemoryItemUpdate,
    MemoryItemResponse,
    PatientIdentityStoryCreate,
    PatientIdentityStoryUpdate,
    PatientIdentityStoryResponse,
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


# ──────────────────────────────────────────────
# PATIENT IDENTITY & LIFE STORY ("WHO AM I?")
# ──────────────────────────────────────────────

@router.get("/elders/{elder_id}/identity-story", response_model=PatientIdentityStoryResponse)
def get_patient_identity_story(
    elder_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Retrieve the elder's full personal identity story and biographical anchors.
    Used when the elder experiences memory lapses, disorientation, or asks 'Who am I?'.
    If not yet customized by caregiver, returns culturally grounded default data based on user profile.
    """
    verify_elder_access(elder_id, current_user, db)

    story = db.query(PatientIdentityStory).filter(PatientIdentityStory.elderly_id == elder_id).first()
    if story:
        return story

    # If no custom story row exists yet, initialize or return default biographical story
    elder_user = db.query(User).filter(User.id == elder_id).first()
    elder_name = elder_user.name if elder_user else "Amit Borah"

    default_story = PatientIdentityStory(
        elderly_id=elder_id,
        full_name=elder_name,
        preferred_name="Borah Babu",
        birth_place="Tezpur, Assam",
        schooling_location="Tezpur Government Higher Secondary School",
        college="Cotton College, Guwahati",
        study_details="Bachelor of Science in Botany (Class of 1968)",
        childhood_friends="Bhaben, Monojit, and Pranjal — your lifelong school friends with whom you played football and cycled along the river.",
        parents_names="Late Hemanta Borah (Father) & Late Pratima Devi (Mother)",
        spouse_name="Anjali Borah",
        kids='[{"name": "Priya Borah", "relation": "Daughter", "location": "Guwahati", "note": "Takes care of you at home"}, {"name": "Rahul Borah", "relation": "Son", "location": "Bengaluru", "note": "Software engineer, calls every Sunday"}]',
        profession="Retired Biology Teacher, Guwahati High School (35 years of dedicated service)",
        home_town="Uzan Bazar, Guwahati, Assam",
        comfort_message="You are safe at home with your loving family. Everything is calm and well.",
    )
    db.add(default_story)
    db.commit()
    db.refresh(default_story)
    return default_story


@router.put("/elders/{elder_id}/identity-story", response_model=PatientIdentityStoryResponse)
def upsert_patient_identity_story(
    elder_id: UUID,
    req: PatientIdentityStoryCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Create or update the elder's identity story.
    Caregivers can input schooling, college, childhood friends, parents' names, and kids.
    """
    verify_elder_access(elder_id, current_user, db)

    story = db.query(PatientIdentityStory).filter(PatientIdentityStory.elderly_id == elder_id).first()
    if not story:
        story = PatientIdentityStory(elderly_id=elder_id, full_name=req.full_name)
        db.add(story)

    story.full_name = req.full_name
    if req.preferred_name is not None:
        story.preferred_name = req.preferred_name
    if req.birth_place is not None:
        story.birth_place = req.birth_place
    if req.schooling_location is not None:
        story.schooling_location = req.schooling_location
    if req.college is not None:
        story.college = req.college
    if req.study_details is not None:
        story.study_details = req.study_details
    if req.childhood_friends is not None:
        story.childhood_friends = req.childhood_friends
    if req.parents_names is not None:
        story.parents_names = req.parents_names
    if req.spouse_name is not None:
        story.spouse_name = req.spouse_name
    if req.kids is not None:
        story.kids = req.kids
    if req.profession is not None:
        story.profession = req.profession
    if req.home_town is not None:
        story.home_town = req.home_town
    if req.comfort_message is not None:
        story.comfort_message = req.comfort_message

    story.updated_at = datetime.now(timezone.utc)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="update_patient_identity_story",
        target_id=story.id,
        details={"elder_id": str(elder_id), "full_name": req.full_name},
    )
    db.add(audit)

    db.commit()
    db.refresh(story)
    return story
