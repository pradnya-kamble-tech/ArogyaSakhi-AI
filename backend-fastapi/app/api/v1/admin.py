from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles, hash_password, get_current_user
from app.models.user import User
from app.models.hospital import Hospital
from app.models.activity_log import ActivityLog
from app.models.emergency_alert import EmergencyAlert
from app.models.ai_prediction import AIPrediction
from app.models.assessment_case import AssessmentCase
from app.models.patient import Patient
from app.models.notification import Notification

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(db: Session = Depends(get_db), user: User = Depends(require_roles("ADMIN"))):
    users = db.query(User).all()
    return [
        {k: getattr(u, k) for k in ("id", "username", "name", "role", "email", "facility", "active", "created_at")}
        for u in users
    ]


@router.post("/users")
def create_user(body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("ADMIN"))):
    if db.query(User).filter(User.username == body.get("username")).first():
        raise HTTPException(400, "Username exists")
    u = User(
        username=body["username"],
        password_hash=hash_password(body.get("password", "default123")),
        name=body.get("name", "User"),
        role=body.get("role", "PCW").upper(),
        facility=body.get("facility"),
        specialty=body.get("specialty"),
        email=body.get("email"),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "username": u.username, "role": u.role}


@router.get("/hospitals")
def admin_hospitals(db: Session = Depends(get_db), user: User = Depends(require_roles("ADMIN", "DOCTOR", "PCW"))):
    return db.query(Hospital).all()


@router.post("/hospitals")
def create_hospital(body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("ADMIN"))):
    h = Hospital(**{k: body[k] for k in body if hasattr(Hospital, k) or k in body})
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.get("/activity-logs")
def activity_logs(db: Session = Depends(get_db), user: User = Depends(require_roles("ADMIN"))):
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(200).all()


@router.get("/emergency-monitoring")
def emergency_monitoring(db: Session = Depends(get_db), user: User = Depends(require_roles("ADMIN", "DOCTOR"))):
    alerts = db.query(EmergencyAlert).order_by(EmergencyAlert.created_at.desc()).limit(50).all()
    return {"alerts": alerts, "open_count": db.query(EmergencyAlert).filter(EmergencyAlert.status == "open").count()}


@router.get("/platform-stats")
def platform_stats(db: Session = Depends(get_db), user: User = Depends(require_roles("ADMIN"))):
    return {
        "total_users": db.query(User).count(),
        "total_patients": db.query(Patient).count(),
        "total_predictions": db.query(AssessmentCase).count(),
        "open_alerts": db.query(EmergencyAlert).filter(EmergencyAlert.status == "open").count(),
        "engine_status": "online",
    }
