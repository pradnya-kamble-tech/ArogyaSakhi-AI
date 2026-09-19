import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.models.user import User
from app.models.patient import Patient
from app.models.refresh_token import RefreshToken
from app.models.activity_log import ActivityLog
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, RefreshRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "email": user.email,
        "phone": user.phone,
        "facility": user.facility,
        "specialty": user.specialty,
        "language": user.language,
    }


def issue_tokens(user: User, db: Session) -> TokenResponse:
    access = create_access_token({"sub": user.id, "role": user.role})
    refresh = create_refresh_token({"sub": user.id})
    token_hash = hashlib.sha256(refresh.encode()).hexdigest()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
    )
    db.commit()
    # Backward compatible shape for the current React frontend:
    # - frontend expects `result.token` to be the access token
    return TokenResponse(
        token=access,
        access_token=access,
        refresh_token=refresh,
        user=user_to_dict(user),
    )


@router.post("/signup", response_model=TokenResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Username already exists")
    role = data.role.upper()
    allowed = {"ASHA_WORKER", "PCW", "DOCTOR", "PATIENT", "ADMIN"}
    if role not in allowed:
        raise HTTPException(400, f"Invalid role. Allowed: {allowed}")
    if role == "ASHA_WORKER":
        role = "PCW"
    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        name=data.name,
        email=data.email,
        phone=data.phone,
        role=role,
        facility=data.facility,
        specialty=data.specialty,
    )
    db.add(user)
    db.flush()

    if role == "PATIENT":
        health_id = f"HID-{str(uuid.uuid4())[:8].upper()}"
        patient = Patient(
            user_id=user.id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            health_id=health_id,
            created_by=user.id,
        )
        db.add(patient)

    db.add(ActivityLog(user_id=user.id, action="signup", entity_type="user", entity_id=user.id))
    db.commit()
    db.refresh(user)
    return issue_tokens(user, db)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username, User.active == True).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    db.add(ActivityLog(user_id=user.id, action="login", entity_type="user", entity_id=user.id))
    db.commit()
    return issue_tokens(user, db)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid refresh token")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(401, "Invalid refresh token")

    token_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()
    stored = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.revoked == False)
        .first()
    )
    if not stored:
        raise HTTPException(401, "Refresh token revoked or not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    stored.revoked = True
    db.commit()
    return issue_tokens(user, db)


@router.post("/logout")
def logout(data: RefreshRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    token_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored:
        stored.revoked = True
        db.commit()
    return {"success": True}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"user": user_to_dict(user)}


@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user:
        reset_token = str(uuid.uuid4())
        # In production: send email. Log for demo.
        print(f"[RESET] User {user.username} token: {reset_token}")
    return {"message": "If account exists, reset instructions sent"}


@router.post("/reset-password")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
  # Simplified demo - accept any token for seeded admin reset via docs
    return {"message": "Use admin panel or contact support in demo mode"}
