from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles, get_current_user
from app.models.user import User
from app.models.assessment_case import AssessmentCase
from app.models.specialist_consultation import SpecialistConsultation
from app.models.patient_observation import PatientObservation
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/cases", tags=["cases"])

class ReviewUpdate(BaseModel):
    status: str
    doctor_notes: str | None = None
    final_diagnosis: str | None = None
    referral_facility: str | None = None

class ConsultationRequest(BaseModel):
    reason: str
    priority: str = "NORMAL"
    handover_note: dict | None = None

class ConsultationReview(BaseModel):
    status: str
    specialist_response: str


@router.get("")
def get_cases(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("DOCTOR", "SPECIALIST", "PCW", "ADMIN", "ASHA_WORKER")),
):
    if user.role in ["DOCTOR", "SPECIALIST"]:
        cases = db.query(AssessmentCase).order_by(AssessmentCase.synced_at.desc()).all()
    elif user.role in ["PCW", "ASHA_WORKER"]:
        cases = db.query(AssessmentCase).filter(AssessmentCase.worker_id == user.id).order_by(AssessmentCase.synced_at.desc()).all()
    else:
        cases = db.query(AssessmentCase).order_by(AssessmentCase.synced_at.desc()).all()
    return {"cases": cases}


@router.post("/{case_id}/review")
def review_case(
    case_id: str,
    update: ReviewUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("DOCTOR", "SPECIALIST")),
):
    db_case = db.query(AssessmentCase).filter(AssessmentCase.client_uuid == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    db_case.status = update.status
    db_case.doctor_id = user.id
    if update.doctor_notes:
        db_case.doctor_notes = update.doctor_notes
    if update.final_diagnosis:
        db_case.final_diagnosis = update.final_diagnosis
    if update.referral_facility:
        db_case.referral_facility = update.referral_facility

    db.commit()
    db.refresh(db_case)
    return {"status": "ok", "case": db_case}

@router.post("/{case_id}/consultations")
def request_consultation(
    case_id: str,
    req: ConsultationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("DOCTOR", "SPECIALIST"))
):
    db_case = db.query(AssessmentCase).filter(AssessmentCase.client_uuid == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    cons = SpecialistConsultation(
        case_id=case_id,
        requesting_user_id=user.id,
        priority=req.priority,
        reason=req.reason,
        handover_note=req.handover_note
    )
    db.add(cons)
    db.commit()
    db.refresh(cons)
    return {"status": "ok", "consultation_id": cons.id}

@router.get("/consultations/queue")
def get_consultations(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("DOCTOR", "SPECIALIST"))
):
    consultations = db.query(SpecialistConsultation).order_by(SpecialistConsultation.created_at.desc()).all()
    # Eagerly load cases for the UI or we can just zip them. For now, we will return objects.
    result = []
    for c in consultations:
        case = db.query(AssessmentCase).filter(AssessmentCase.client_uuid == c.case_id).first()
        c_dict = {
            "id": c.id, "case_id": c.case_id, "priority": c.priority, "reason": c.reason,
            "status": c.status, "specialist_response": c.specialist_response, "created_at": c.created_at,
            "case": case
        }
        result.append(c_dict)
    return {"consultations": result}

@router.post("/consultations/{consultation_id}/review")
def review_consultation(
    consultation_id: str,
    req: ConsultationReview,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("DOCTOR", "SPECIALIST"))
):
    from datetime import datetime
    cons = db.query(SpecialistConsultation).filter(SpecialistConsultation.id == consultation_id).first()
    if not cons:
        raise HTTPException(status_code=404, detail="Consultation not found")
        
    cons.status = req.status
    cons.specialist_response = req.specialist_response
    cons.specialist_id = user.id
    cons.specialist_review_timestamp = datetime.utcnow()
    
    db.commit()
    db.refresh(cons)
    return {"status": "ok", "consultation": cons}



@router.get("/{case_id}")
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch a single AssessmentCase by client_uuid."""
    db_case = db.query(AssessmentCase).filter(AssessmentCase.client_uuid == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    return db_case


@router.get("/{case_id}/trends")
def get_case_trends(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Return historical physiological observations for a case (and its patient if linked).
    If fewer than 2 observations exist, the frontend should display
    'Insufficient observations for trend analysis.'
    """
    # First look up the case so we can also find observations by patient_id
    db_case = db.query(AssessmentCase).filter(AssessmentCase.client_uuid == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Collect observations: by case_id first, then by patient_id if available
    obs_q = db.query(PatientObservation).filter(PatientObservation.case_id == case_id)
    observations = obs_q.order_by(PatientObservation.observed_at.asc()).all()

    # Also include observations linked to the same patient (other cases)
    if db_case.patient_id and len(observations) < 2:
        patient_obs = (
            db.query(PatientObservation)
            .filter(PatientObservation.patient_id == db_case.patient_id)
            .order_by(PatientObservation.observed_at.asc())
            .all()
        )
        # Deduplicate by id
        seen = {o.id for o in observations}
        for o in patient_obs:
            if o.id not in seen:
                observations.append(o)
                seen.add(o.id)
        observations.sort(key=lambda x: x.observed_at)

    # If still no stored observations, synthesize one from the case's own vitals
    # (this represents the single recorded observation — no trend can be drawn)
    if not observations and db_case.inputs:
        vitals = db_case.inputs.get("vitals", {}) if isinstance(db_case.inputs, dict) else {}
        if vitals:
            synthetic = {
                "id": "case_vitals",
                "case_id": case_id,
                "patient_id": db_case.patient_id,
                "bp_systolic": vitals.get("bp_systolic"),
                "bp_diastolic": vitals.get("bp_diastolic"),
                "heart_rate": vitals.get("heart_rate"),
                "temperature": vitals.get("temperature"),
                "spo2": vitals.get("spo2"),
                "respiratory_rate": vitals.get("respiratory_rate"),
                "blood_sugar": vitals.get("blood_sugar"),
                "hb": vitals.get("hb"),
                "risk_level": db_case.risk_level,
                "observed_at": db_case.synced_at.isoformat() if db_case.synced_at else None,
                "notes": "Captured at initial assessment",
            }
            return {
                "case_id": case_id,
                "observation_count": 1,
                "sufficient_for_trend": False,
                "observations": [synthetic],
                "message": "Insufficient observations for trend analysis.",
            }

    serialized = [
        {
            "id": o.id,
            "case_id": o.case_id,
            "patient_id": o.patient_id,
            "bp_systolic": o.bp_systolic,
            "bp_diastolic": o.bp_diastolic,
            "heart_rate": o.heart_rate,
            "temperature": o.temperature,
            "spo2": o.spo2,
            "respiratory_rate": o.respiratory_rate,
            "blood_sugar": o.blood_sugar,
            "hb": o.hb,
            "risk_level": o.risk_level,
            "observed_at": o.observed_at.isoformat() if o.observed_at else None,
            "notes": o.notes,
        }
        for o in observations
    ]

    return {
        "case_id": case_id,
        "observation_count": len(serialized),
        "sufficient_for_trend": len(serialized) >= 2,
        "observations": serialized,
        "message": None if len(serialized) >= 2 else "Insufficient observations for trend analysis.",
    }


class ObservationCreate(BaseModel):
    bp_systolic: Optional[float] = None
    bp_diastolic: Optional[float] = None
    heart_rate: Optional[float] = None
    temperature: Optional[float] = None
    spo2: Optional[float] = None
    respiratory_rate: Optional[float] = None
    blood_sugar: Optional[float] = None
    hb: Optional[float] = None
    risk_level: Optional[str] = None
    notes: Optional[str] = None


@router.post("/{case_id}/observations")
def add_observation(
    case_id: str,
    obs: ObservationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("PCW", "ASHA_WORKER", "DOCTOR", "SPECIALIST")),
):
    """Record a new physiological observation against a case."""
    db_case = db.query(AssessmentCase).filter(AssessmentCase.client_uuid == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    new_obs = PatientObservation(
        case_id=case_id,
        patient_id=db_case.patient_id,
        worker_id=user.id,
        **obs.model_dump(exclude_none=False),
    )
    db.add(new_obs)
    db.commit()
    db.refresh(new_obs)
    return {"status": "ok", "observation_id": new_obs.id}
