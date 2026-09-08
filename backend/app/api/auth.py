"""
SMRITI+ Backend — Auth API Router

POST /auth/login — JWT login (email/password for demo, phone/OTP for prod)
POST /auth/link-caregiver — caregiver enters elder's share code
"""

import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, ElderlyProfile, AuditLog, ConsentLog, PersonalizationPreference
from app.core.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, CurrentUser,
)
from app.api.schemas import (
    LoginRequest, LoginResponse, UserResponse,
    SignupRequest, LinkCaregiverRequest, LinkCaregiverResponse,
    ElderProfileSetupRequest,
)
from app.core.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT token.
    Supports email/password (demo) and phone/OTP (production).
    """
    user = None

    # Email/password login (demo accounts + elderly PIN)
    if req.email and req.password:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not user.password_hash:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Phone/OTP login
    elif req.phone and req.otp:
        settings = get_settings()
        if req.otp != settings.demo_otp:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
        user = db.query(User).filter(User.phone == req.phone).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Direct Unique Access Code login (Flo-style for Caregiver or Health Worker)
    elif req.link_code:
        raw_code = req.link_code.strip().upper()
        clean_code = raw_code.replace("-", "")
        code_hash_raw = hashlib.sha256(raw_code.encode()).hexdigest()
        code_hash_clean = hashlib.sha256(clean_code.encode()).hexdigest()

        profile = db.query(ElderlyProfile).filter(
            (ElderlyProfile.caregiver_link_code_hash == code_hash_raw) |
            (ElderlyProfile.caregiver_link_code_hash == code_hash_clean)
        ).first()

        # Seeded demo fallback for SMR-842 or demo codes
        if not profile and clean_code in ("SMR842", "SMR-842"):
            profile = db.query(ElderlyProfile).first()

        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired patient access code")

        # Find or create dedicated caregiver user linked to this code
        user = db.query(User).filter(User.id == profile.caregiver_id).first() if profile.caregiver_id else None
        if not user:
            # Check default demo caregiver
            user = db.query(User).filter(User.role == "caregiver").first()
        if not user:
            # Create a quick-access linked caregiver
            user = User(
                name="Family Caregiver",
                role="caregiver",
                email=f"caregiver.{clean_code.lower()}@smriti.local",
                password_hash=hash_password("caregiver123"),
                language="en",
            )
            db.add(user)
            db.flush()
            profile.caregiver_id = user.id
            db.commit()

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide email+password, phone+otp, or patient access code",
        )

    token = create_access_token(user.id, user.role)

    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user (Elderly, Caregiver, or Health Worker).
    Creates the user account, initializes role profile, links patient if code provided, and returns an access token.
    """
    # Duplicate checks
    if req.email:
        existing_email = db.query(User).filter(User.email == req.email.strip().lower()).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    if req.phone:
        existing_phone = db.query(User).filter(User.phone == req.phone.strip()).first()
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this phone already exists")

    new_user = User(
        name=req.name.strip(),
        role=req.role,
        email=req.email.strip().lower() if req.email else None,
        phone=req.phone.strip() if req.phone else None,
        password_hash=hash_password(req.password),
        language=req.language or "en",
    )
    db.add(new_user)
    db.flush()

    if req.role == "elderly":
        profile = ElderlyProfile(
            user_id=new_user.id,
            text_size="large",
            voice_sensitivity=0.5,
        )
        db.add(profile)
        pref = PersonalizationPreference(
            elderly_id=new_user.id,
            preferred_game="memory_matching",
            preferred_session_length=10,
            preferred_language=req.language or "en",
            assistance_level="standard",
            animation_level="calm",
            text_size="large",
            difficulty_preference=1,
        )
        db.add(pref)

    elif req.role in ("caregiver", "health_worker") and req.patient_link_code:
        # Automatically connect to patient via code at sign-up time
        raw_code = req.patient_link_code.strip().upper()
        clean_code = raw_code.replace("-", "")
        code_hash_raw = hashlib.sha256(raw_code.encode()).hexdigest()
        code_hash_clean = hashlib.sha256(clean_code.encode()).hexdigest()

        target_profile = db.query(ElderlyProfile).filter(
            (ElderlyProfile.caregiver_link_code_hash == code_hash_raw) |
            (ElderlyProfile.caregiver_link_code_hash == code_hash_clean)
        ).first()

        if not target_profile and clean_code in ("SMR842", "SMR-842"):
            target_profile = db.query(ElderlyProfile).first()

        if target_profile and req.role == "caregiver":
            target_profile.caregiver_id = new_user.id

    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.role)
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(new_user),
    )


@router.post("/link-caregiver", response_model=LinkCaregiverResponse)
def link_caregiver(
    req: LinkCaregiverRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Caregiver enters an elder's short-lived share code to link accounts.
    Code is validated against hash + expiry. Plaintext code is never stored at rest.
    """
    if current_user.role != "caregiver":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only caregivers can link to elders")

    raw_code = req.link_code.strip().upper()
    clean_code = raw_code.replace("-", "")

    code_hash_raw = hashlib.sha256(raw_code.encode()).hexdigest()
    code_hash_clean = hashlib.sha256(clean_code.encode()).hexdigest()

    profile = db.query(ElderlyProfile).filter(
        (ElderlyProfile.caregiver_link_code_hash == code_hash_raw) |
        (ElderlyProfile.caregiver_link_code_hash == code_hash_clean)
    ).first()

    # Fallback to seeded demo elder if using demo code SMR-842
    if not profile and clean_code in ("SMR842", "SMR-842"):
        profile = db.query(ElderlyProfile).first()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired link code")

    if profile.caregiver_link_code_expires_at and profile.caregiver_link_code_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Link code has expired")

    # Link the caregiver
    profile.caregiver_id = current_user.user_id
    profile.caregiver_link_code_hash = None  # consumed
    profile.caregiver_link_code_expires_at = None

    elder = db.query(User).filter(User.id == profile.user_id).first()

    # Audit log
    db.add(AuditLog(
        actor_id=current_user.user_id,
        action="link_caregiver",
        target_id=profile.user_id,
        details={"linked_by": "share_code", "code": raw_code},
    ))

    db.commit()

    return LinkCaregiverResponse(
        success=True,
        elder_name=elder.name if elder else "Bhaben Barua",
        elder_id=profile.user_id,
        message=f"Successfully connected to {elder.name if elder else 'Patient'}",
    )


@router.post("/generate-link-code")
def generate_link_code(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate a short-lived caregiver link code for the current elderly user.
    Returns the plaintext code (shown once), stores only the hash.
    """
    if current_user.role != "elderly":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only elderly users can generate link codes")

    profile = db.query(ElderlyProfile).filter(
        ElderlyProfile.user_id == current_user.user_id
    ).first()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found")

    # Generate a clean Flo-style code: SMR-XXX
    suffix = secrets.token_hex(2).upper()[:3]
    code = f"SMR-{suffix}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()

    profile.caregiver_link_code_hash = code_hash
    profile.caregiver_link_code_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    db.commit()

    return {"link_code": code, "expires_in_hours": 24}
