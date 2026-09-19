import random
import re
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles, hash_password
from app.models.user import User
from app.models.patient import Patient
from app.models.patient_visit import PatientVisit
from app.models.activity_log import ActivityLog
from app.models.ai_prediction import AIPrediction
from app.models.health_report import HealthReport
from app.models.emergency_alert import EmergencyAlert
from app.models.prescription import Prescription
from app.models.uploaded_image import UploadedImage
from app.models.symptom import Symptom
from app.schemas.patient import PatientCreate, PatientResponse

router = APIRouter(tags=["patients"])


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

@router.post("/patients")
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("PCW", "ASHA_WORKER", "DOCTOR", "ADMIN")),
):
    username = _generate_username(db, data.name or "patient", data.phone)
    password = _generate_password()
    health_id = data.health_id or _generate_health_id(db)

    new_user = User(
        username=username,
        password_hash=hash_password(password),
        name=data.name,
        phone=data.phone,
        email=data.email,
        role="PATIENT",
    )
    db.add(new_user)
    db.flush()

    patient_data = data.model_dump()
    patient_data["user_id"] = new_user.id
    patient_data["created_by"] = user.id
    patient_data["health_id"] = health_id
    if user.role in ("PCW", "ASHA_WORKER"):
        patient_data["asha_worker_id"] = user.id

    patient = Patient(**patient_data)
    db.add(patient)
    db.add(ActivityLog(user_id=user.id, action="create_patient", entity_type="patient", entity_id=patient.id))
    db.commit()
    db.refresh(patient)
    return {
        "patient": patient,
        "credentials": {
            "username": username,
            "password": password,
            "health_id": health_id,
            "phone": data.phone,
        },
    }


@router.get("/patients", response_model=list[PatientResponse])
def list_patients(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Patient)
    if user.role in ("PCW", "ASHA_WORKER"):
        q = q.filter(Patient.asha_worker_id == user.id)
    elif user.role == "PATIENT":
        q = q.filter(or_(Patient.user_id == user.id, Patient.created_by == user.id))
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Patient.name.ilike(like))
            | (Patient.phone.ilike(like))
            | (Patient.health_id.ilike(like))
        )
    return q.order_by(Patient.created_at.desc()).limit(100).all()


# Backward-compatible alias for the existing React frontend.
@router.get("/api/patients", response_model=list[PatientResponse])
def list_patients_api(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_patients(search=search, db=db, user=user)


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    if user.role == "PATIENT" and patient.user_id != user.id:
        raise HTTPException(403, "Access denied")
    return patient


@router.get("/patient/me", response_model=PatientResponse)
def patient_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter((Patient.user_id == user.id) | (Patient.created_by == user.id)).first()
    if not patient:
        raise HTTPException(404, "Patient profile not found")
    return patient


@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    data: PatientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("PCW", "ASHA_WORKER", "DOCTOR", "ADMIN")),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    for k, v in data.model_dump().items():
        setattr(patient, k, v)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/patients/{patient_id}/visits")
def get_visits(patient_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    if user.role == "PATIENT" and patient.user_id != user.id:
        raise HTTPException(403, "Access denied")
    visits = db.query(PatientVisit).filter(PatientVisit.patient_id == patient_id).order_by(PatientVisit.created_at.desc()).all()
    return visits


@router.post("/patients/{patient_id}/visits")
def create_visit(
    patient_id: str,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("PCW", "ASHA_WORKER", "DOCTOR")),
):
    visit = PatientVisit(
        patient_id=patient_id,
        asha_worker_id=user.id,
        vitals=body.get("vitals"),
        symptoms=body.get("symptoms"),
        notes=body.get("notes"),
        risk_level=body.get("risk_level"),
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit
