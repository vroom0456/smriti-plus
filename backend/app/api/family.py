"""
SMRITI+ — Family Contacts API Router (Family Corner)

Implements Section 37 & Phase 2 Requirements:
- GET /elders/{elder_id}/family — list family contacts
- POST /elders/{elder_id}/family — add family contact
- PATCH /family/{contact_id} — update family contact
- DELETE /family/{contact_id} — delete family contact
"""

from uuid import UUID
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import FamilyContact, AuditLog, ElderlyProfile
from app.core.auth import get_current_user, CurrentUser, verify_elder_access
from app.api.schemas import (
    FamilyContactCreate,
    FamilyContactUpdate,
    FamilyContactResponse,
)

router = APIRouter(tags=["Family Corner"])


@router.get("/elders/{elder_id}/family", response_model=List[FamilyContactResponse])
def get_family_contacts(
    elder_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """List all registered family and emergency contacts for the elder."""
    verify_elder_access(elder_id, current_user, db)

    contacts = (
        db.query(FamilyContact)
        .filter(FamilyContact.elderly_id == elder_id)
        .order_by(FamilyContact.is_primary.desc(), FamilyContact.created_at.asc())
        .all()
    )
    return contacts


@router.post("/elders/{elder_id}/family", response_model=FamilyContactResponse, status_code=status.HTTP_201_CREATED)
def add_family_contact(
    elder_id: UUID,
    req: FamilyContactCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Add a new family contact. Caregiver or elder himself/herself."""
    verify_elder_access(elder_id, current_user, db)

    # If new contact is set as primary, unmark any previous primary
    if req.is_primary:
        db.query(FamilyContact).filter(FamilyContact.elderly_id == elder_id).update({"is_primary": False})

    contact = FamilyContact(
        elderly_id=elder_id,
        name=req.name,
        relationship_label=req.relationship_label,
        phone=req.phone,
        photo_url=req.photo_url,
        is_primary=req.is_primary,
    )
    db.add(contact)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="create_family_contact",
        target_id=contact.id,
        details={"elder_id": str(elder_id), "name": req.name, "relationship": req.relationship_label},
    )
    db.add(audit)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/family/{contact_id}", response_model=FamilyContactResponse)
def update_family_contact(
    contact_id: UUID,
    req: FamilyContactUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update contact information."""
    contact = db.query(FamilyContact).filter(FamilyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    verify_elder_access(contact.elderly_id, current_user, db)

    if req.is_primary is True:
        db.query(FamilyContact).filter(FamilyContact.elderly_id == contact.elderly_id).update({"is_primary": False})
        contact.is_primary = True
    elif req.is_primary is False:
        contact.is_primary = False

    if req.name is not None:
        contact.name = req.name
    if req.relationship_label is not None:
        contact.relationship_label = req.relationship_label
    if req.phone is not None:
        contact.phone = req.phone
    if req.photo_url is not None:
        contact.photo_url = req.photo_url

    contact.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/family/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a family contact."""
    contact = db.query(FamilyContact).filter(FamilyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    verify_elder_access(contact.elderly_id, current_user, db)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="delete_family_contact",
        target_id=contact_id,
        details={"elder_id": str(contact.elderly_id), "name": contact.name},
    )
    db.add(audit)
    db.delete(contact)
    db.commit()
    return None
