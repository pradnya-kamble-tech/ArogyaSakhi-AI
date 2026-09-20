from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User
from app.models.assessment_case import AssessmentCase
from pydantic import BaseModel

router = APIRouter(prefix="/cases", tags=["cases"])

class ReviewUpdate(BaseModel):
    status: str
    doctor_notes: str | None = None
    final_diagnosis: str | None = None
    referral_facility: str | None = None


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
