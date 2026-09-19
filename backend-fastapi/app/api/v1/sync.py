import random
import re
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles, hash_password
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientCreate

router = APIRouter(prefix="/sync", tags=["sync"])


def _generate_username(db: Session, name: str, phone: str | None):
    base = re.sub(r"[^a-zA-Z]", "", name.lower())[:6] or "patient"
    suffix = ""
    if phone:
        digits = re.sub(r"\D", "", phone)
        suffix = digits[-4:] if digits else ""
    username = f"{base}{suffix}" if suffix else base
    candidate = username
    counter = 1
    while db.query(User).filter(User.username == candidate).first():
        candidate = f"{username}{counter}"
        counter += 1
    return candidate


def _generate_password():
    return f"pat@{random.randint(1000, 9999)}"


def _generate_health_id(db: Session):
    base = "PAT"
    candidate = f"{base}{random.randint(1000, 9999)}"
    while db.query(Patient).filter(Patient.health_id == candidate).first():
        candidate = f"{base}{random.randint(1000, 9999)}"
    return candidate


@router.post("/batch")
def batch_sync(
    items: list[dict],
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("PCW", "ASHA_WORKER")),
):
    results = []
    for item in items:
        action = item.get("action")
        payload = item.get("payload", {})
        temp_id = item.get("temp_id")
        try:
            if action == "create_patient":
                username = _generate_username(db, payload.get("name", "patient"), payload.get("phone"))
                password = _generate_password()
                health_id = payload.get("health_id") or _generate_health_id(db)
                new_user = User(
                    username=username,
                    password_hash=hash_password(password),
                    name=payload.get("name", "Patient"),
                    phone=payload.get("phone"),
                    email=payload.get("email"),
                    role="PATIENT",
                )
                db.add(new_user)
                db.flush()
                patient_data = {**payload}
                patient_data["user_id"] = new_user.id
                patient_data["created_by"] = user.id
                patient_data["asha_worker_id"] = user.id
                patient_data["health_id"] = health_id
                p = Patient(**patient_data)
                db.add(p)
                db.commit()
                db.refresh(p)
                results.append({"temp_id": temp_id, "status": "ok", "id": p.id, "credentials": {"username": username, "password": password, "health_id": health_id}})
            else:
                results.append({"temp_id": temp_id, "status": "skipped", "reason": "unknown action"})
        except Exception as e:
            results.append({"temp_id": temp_id, "status": "error", "error": str(e)})
    return {"synced": results}
