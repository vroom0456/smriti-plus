"""
SMRITI+ Backend — Authentication & Authorization

JWT-based auth with three roles: elderly, caregiver, health_worker.
PIN login for elderly, email/password for demo, OTP stub for caregiver/health_worker.
RBAC enforced server-side on every endpoint.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Literal
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.database import get_db
from app.db.models import User, ElderlyProfile

import bcrypt
security_scheme = HTTPBearer()


# ──────────────────────────────────────────────
# PASSWORD / PIN HASHING
# ──────────────────────────────────────────────

def hash_password(password: str) -> str:
    pwd_bytes = password[:72].encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain[:72].encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ──────────────────────────────────────────────
# JWT TOKEN
# ──────────────────────────────────────────────

def create_access_token(user_id: UUID, role: str, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# ──────────────────────────────────────────────
# CURRENT USER DEPENDENCY
# ──────────────────────────────────────────────

class CurrentUser:
    """Extracted from JWT — the only source of identity for authorization."""
    def __init__(self, user_id: UUID, role: str):
        self.user_id = user_id
        self.role = role


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> CurrentUser:
    """Extract authenticated user from JWT token. Never trust client-supplied identity."""
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    role = payload.get("role")
    if not user_id or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    return CurrentUser(user_id=UUID(user_id), role=role)


# ──────────────────────────────────────────────
# ROLE GUARDS
# ──────────────────────────────────────────────

def require_role(*allowed_roles: str):
    """FastAPI dependency factory — restricts endpoint to specific roles."""
    def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker


# ──────────────────────────────────────────────
# OWNERSHIP GUARDS
# ──────────────────────────────────────────────

def verify_elder_access(
    elder_id: UUID,
    current_user: CurrentUser,
    db: Session,
) -> None:
    """
    Verify the current user has access to the specified elder.
    - Elderly users can only access their own data.
    - Caregivers can only access their linked elders.
    - Health workers can only access elders in their assigned group.
    """
    if current_user.role == "elderly":
        if current_user.user_id != elder_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return

    if current_user.role == "caregiver":
        profile = db.query(ElderlyProfile).filter(
            ElderlyProfile.user_id == elder_id,
            ElderlyProfile.caregiver_id == current_user.user_id,
        ).first()
        if not profile:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied — elder not linked to you")
        return

    if current_user.role == "health_worker":
        # Health worker must be in the same group as the elder
        profile = db.query(ElderlyProfile).filter(
            ElderlyProfile.user_id == elder_id,
        ).first()
        if not profile or not profile.health_worker_group_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        # Check the health worker's assigned groups — for MVP, group_id is stored
        # on the user's own record or we check against the elder's group
        # For simplicity in MVP: health worker's user_id is their group scope
        worker = db.query(User).filter(User.id == current_user.user_id).first()
        if not worker:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        # The elder's health_worker_group_id must match the health worker's assigned group
        # For seed data, we set health_worker_group_id = health_worker's user_id
        if profile.health_worker_group_id != current_user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied — elder not in your group")
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def verify_caregiver_owns_elder(
    elder_id: UUID,
    current_user: CurrentUser,
    db: Session,
) -> None:
    """Verify a caregiver has edit access to this elder's reminders."""
    if current_user.role != "caregiver":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only caregivers can manage reminders")
    profile = db.query(ElderlyProfile).filter(
        ElderlyProfile.user_id == elder_id,
        ElderlyProfile.caregiver_id == current_user.user_id,
    ).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Elder not linked to you")
