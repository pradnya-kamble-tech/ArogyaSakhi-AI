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
from app.models.assessment_case import AssessmentCase
from app.models.patient_observation import PatientObservation
import json


def _derive_priority(risk_level: str, engine_output: dict) -> str:
    """
    Derive a priority level from deterministic risk data only.
    CRITICAL: Red + red-flag vitals present
    HIGH:     Red risk
    MEDIUM:   Amber/Yellow risk
    NORMAL:   Green or unknown
    The LLM is never consulted for priority.
    """
    if not risk_level:
        return "NORMAL"
    rl = risk_level.upper()
    if rl == "RED":
        # Check for critical vital red-flags in engine output
        reasons = []
        if isinstance(engine_output, dict):
            reasons = engine_output.get("risk", {}).get("reasons", []) or \
                      engine_output.get("reasons", []) or []
        critical_keywords = [
            "critical", "spo2", "bp systolic", "seizure", "unconscious",
            "bleeding", "not breathing", "cardiac",
        ]
        is_critical = any(
            any(kw in str(r).lower() for kw in critical_keywords)
            for r in reasons
        )
        return "CRITICAL" if is_critical else "HIGH"
    if rl in ("AMBER", "YELLOW"):
        return "MEDIUM"
    return "NORMAL"

@router.post("/cases")
def sync_cases(
    items: list[dict],
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("PCW", "ASHA_WORKER")),
):
    results = []
    for item in items:
        # Expected structure matches Dexie payloads: 
        # { client_uuid, patient_name, patient_age, symptoms, vitals, engine_output }
        client_uuid = item.get("client_uuid")
        if not client_uuid:
            results.append({"client_uuid": None, "status": "error", "error": "Missing client_uuid"})
            continue
            
        try:
            # Idempotent check
            existing = db.query(AssessmentCase).filter(AssessmentCase.client_uuid == client_uuid).first()
            if existing:
                results.append({"client_uuid": client_uuid, "status": "ignored", "reason": "Already exists"})
                continue
            
            engine_output = item.get("engine_output", {})
            risk_level = engine_output.get("category", "Unknown")
            escalation = "Yes" if risk_level in ["Red", "Amber"] else "No"
            priority = _derive_priority(risk_level, engine_output)
            
            case = AssessmentCase(
                client_uuid=client_uuid,
                patient_name=item.get("patient_name"),
                patient_age=item.get("patient_age"),
                worker_id=user.id,
                inputs={"symptoms": item.get("symptoms", []), "vitals": item.get("vitals", {})},
                engine_output=engine_output,
                risk_level=risk_level,
                escalation=escalation,
                priority=priority,
                status="pending_review"
            )
            db.add(case)
            db.commit()

            # Auto-record vitals as a PatientObservation for trend tracking
            v = item.get("vitals", {}) or {}
            if v:
                obs = PatientObservation(
                    case_id=client_uuid,
                    patient_id=None,  # no patient_id at sync time
                    worker_id=user.id,
                    bp_systolic=float(v["bp_systolic"]) if v.get("bp_systolic") else None,
                    bp_diastolic=float(v["bp_diastolic"]) if v.get("bp_diastolic") else None,
                    heart_rate=float(v["heart_rate"]) if v.get("heart_rate") else None,
                    temperature=float(v["temperature"]) if v.get("temperature") else None,
                    spo2=float(v["spo2"]) if v.get("spo2") else None,
                    respiratory_rate=float(v["respiratory_rate"]) if v.get("respiratory_rate") else None,
                    blood_sugar=float(v["blood_sugar"]) if v.get("blood_sugar") else None,
                    hb=float(v["hb"]) if v.get("hb") else None,
                    risk_level=risk_level,
                    notes="Auto-recorded at case sync",
                )
                db.add(obs)
                db.commit()

            results.append({"client_uuid": client_uuid, "status": "ok"})
        except Exception as e:
            db.rollback()
            results.append({"client_uuid": client_uuid, "status": "error", "error": str(e)})
            
    return {"synced": results}


@router.get("/downstream")
def downstream_sync(
    since: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("PCW", "ASHA_WORKER")),
):
    """
    Return cases that changed on the server since the given ISO timestamp.
    Used for pull-based downstream sync from rural worker devices.
    Returns: { cases: [...], server_time: ISO }
    """
    from datetime import datetime as dt
    from app.models.assessment_case import AssessmentCase

    q = db.query(AssessmentCase).filter(AssessmentCase.worker_id == user.id)
    if since:
        try:
            since_dt = dt.fromisoformat(since.replace("Z", "+00:00"))
            q = q.filter(AssessmentCase.updated_at >= since_dt)
        except ValueError:
            pass  # invalid timestamp — return all

    cases = q.order_by(AssessmentCase.synced_at.desc()).limit(200).all()
    return {
        "cases": [
            {
                "client_uuid": c.client_uuid,
                "patient_name": c.patient_name,
                "patient_age": c.patient_age,
                "risk_level": c.risk_level,
                "priority": c.priority,
                "status": c.status,
                "doctor_notes": c.doctor_notes,
                "final_diagnosis": c.final_diagnosis,
                "referral_facility": c.referral_facility,
                "escalation": c.escalation,
                "synced_at": c.synced_at.isoformat() if c.synced_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in cases
        ],
        "server_time": dt.utcnow().isoformat(),
    }
