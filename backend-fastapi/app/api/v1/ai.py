import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.patient import Patient
from app.models.ai_prediction import AIPrediction
from app.models.chat_log import ChatLog
from app.models.health_report import HealthReport
from app.models.emergency_alert import EmergencyAlert
from app.models.notification import Notification
from app.models.uploaded_image import UploadedImage
from pydantic import BaseModel
from app.models.voice_log import VoiceLog
from app.models.activity_log import ActivityLog
from app.schemas.ai import SymptomCheckRequest, VoiceIntentRequest, SOSRequest, ChatRequest
from app.ml.risk_engine import evaluate_risk
from app.ml.skin_detection import analyze_skin_image
from app.ml.voice_intent import classify_intent
from app.ml.chatbot import generate_patient_chat_response
from app.websocket.manager import manager
from app.api.v1.analytics import _serialize_alert
from app.core.llm_service import (
    explain_decision, handover_note, differential_support,
    extract_voice_symptoms, clinical_summary,
)

router = APIRouter(prefix="/ai", tags=["ai"])
settings = get_settings()


async def _handle_high_risk(db: Session, user: User, patient_id: str | None, result: dict):
    if result.get("risk_level") != "Red":
        return None
    alert = EmergencyAlert(
        patient_id=patient_id,
        triggered_by_user_id=user.id,
        risk_level="Red",
        alert_type="ai_risk",
        message=f"High risk detected: {result.get('probable_condition')}",
        meta=result,
    )
    db.add(alert)
    for role in ("DOCTOR", "ADMIN"):
        doctors = db.query(User).filter(User.role == role).all()
        for d in doctors:
            db.add(
                Notification(
                    user_id=d.id,
                    title="Emergency Alert",
                    body=alert.message,
                    type="emergency",
                    related_alert_id=alert.id,
                )
            )
    db.commit()
    db.refresh(alert)
    try:
        serialized = _serialize_alert(alert, db)
    except Exception:
        serialized = {"id": alert.id, "message": alert.message, "patient_id": patient_id, "risk_level": "Red"}
    await manager.broadcast_alert(
        {"type": "emergency", "alert": serialized},
        roles=["DOCTOR", "ADMIN", "PCW"],
    )
    return alert


@router.post("/symptom-checker")
async def symptom_checker(
    data: SymptomCheckRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = evaluate_risk(data.model_dump())
    pred = AIPrediction(
        patient_id=data.patient_id,
        user_id=user.id,
        model_type="symptom_checker",
        inputs=data.model_dump(),
        outputs=result,
        risk_score=result["risk_percentage"],
        risk_level=result["risk_level"],
        probable_condition=result["probable_condition"],
        recommendations="; ".join(result["recommendations"]),
    )
    db.add(pred)
    if data.patient_id:
        patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
        if patient:
            patient.risk_level = result["risk_level"]
        db.add(
            HealthReport(
                patient_id=data.patient_id,
                report_type="symptom_analysis",
                generated_by_model="symptom_checker",
                data=result,
            )
        )
    alert = await _handle_high_risk(db, user, data.patient_id, result)
    db.add(ActivityLog(user_id=user.id, action="symptom_check", entity_type="ai_prediction", entity_id=pred.id))
    db.commit()
    db.refresh(pred)
    return {"prediction": result, "prediction_id": pred.id, "alert": alert.id if alert else None}


@router.post("/risk-engine")
async def risk_engine_endpoint(
    data: SymptomCheckRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await symptom_checker(data, db, user)


@router.post("/skin-disease-detect")
async def skin_detect(
    file: UploadFile = File(...),
    patient_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "img.jpg").suffix or ".jpg"
    fname = f"{uuid.uuid4()}{ext}"
    fpath = upload_dir / fname
    content = await file.read()
    fpath.write_bytes(content)

    result = analyze_skin_image(str(fpath))
    img = UploadedImage(
        patient_id=patient_id,
        uploader_id=user.id,
        image_type="skin",
        file_path=str(fpath),
        model_output=result,
        confidence=result.get("confidence"),
    )
    db.add(img)
    pred = AIPrediction(
        patient_id=patient_id,
        user_id=user.id,
        model_type="skin_detection",
        inputs={"filename": file.filename},
        outputs=result,
        risk_score=result.get("confidence"),
        risk_level="Red" if result.get("severity") == "high" else "Yellow" if result.get("severity") == "medium" else "Green",
        probable_condition=result.get("condition"),
    )
    db.add(pred)
    db.commit()
    db.refresh(img)
    return {"image_id": img.id, "analysis": result}


@router.post("/voice-intent")
def voice_intent(
    data: VoiceIntentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = classify_intent(data.transcript, data.language)
    log = VoiceLog(
        user_id=user.id,
        transcript=data.transcript,
        language=data.language,
        intent=result["intent"],
        action_result=result,
        related_patient_id=data.patient_id,
    )
    db.add(log)
    db.commit()
    return result


@router.post("/chat")
def chat_with_patient(
    data: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    patient = None
    prediction = None
    if data.patient_id:
        patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
        prediction = (
            db.query(AIPrediction)
            .filter(AIPrediction.patient_id == data.patient_id)
            .order_by(AIPrediction.created_at.desc())
            .first()
        )
    latest_prediction = prediction.outputs if prediction else None
    response = generate_patient_chat_response(patient, data.message, data.chat_history, latest_prediction)
    db.add(
        ChatLog(
            patient_id=data.patient_id,
            user_id=user.id,
            message=data.message,
            response=response,
            meta={"intent_source": "chatbot"},
        )
    )
    db.commit()
    return {"reply": response, "patient_id": data.patient_id}


@router.post("/sos")
async def emergency_sos(
    data: SOSRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meta = {
        "symptoms": getattr(data, "symptoms", None),
        "anatomy_part": getattr(data, "anatomy_part", None),
        "images": getattr(data, "images", None),
        "ai_result": getattr(data, "ai_result", None),
        "asha_name": getattr(data, "asha_name", None),
    }
    alert = EmergencyAlert(
        patient_id=data.patient_id,
        triggered_by_user_id=user.id,
        risk_level="Red",
        status="open",
        alert_type="sos",
        message=data.message or "Emergency SOS triggered",
        latitude=data.latitude,
        longitude=data.longitude,
        meta=meta,
    )
    db.add(alert)
    for role in ("DOCTOR", "ADMIN"):
        for u in db.query(User).filter(User.role == role).all():
            db.add(Notification(user_id=u.id, title="SOS Emergency", body=alert.message, type="sos", related_alert_id=alert.id))
    db.commit()
    db.refresh(alert)
    try:
        serialized = _serialize_alert(alert, db)
    except Exception:
        serialized = {"id": alert.id, "message": alert.message, "patient_id": data.patient_id}
    await manager.broadcast_alert({"type": "sos", "alert": serialized})
    return {"alert_id": alert.id, "status": "dispatched"}

class CaseAIRequest(BaseModel):
    case_data: dict

@router.post("/explain")
async def ai_explain(
    req: CaseAIRequest,
    user: User = Depends(get_current_user)
):
    data = await explain_decision(req.case_data)
    return {"explanation": data}

@router.post("/handover-note")
async def ai_handover(
    req: CaseAIRequest,
    user: User = Depends(get_current_user)
):
    data = await handover_note(req.case_data)
    return {"note": data}

@router.post("/differential")
async def ai_differential(
    req: CaseAIRequest,
    user: User = Depends(get_current_user)
):
    data = await differential_support(req.case_data)
    return {"differential": data}

class VoiceExtractRequest(BaseModel):
    transcript: str

@router.post("/voice-extract")
async def voice_extract(
    req: VoiceExtractRequest,
    user: User = Depends(get_current_user)
):
    data = await extract_voice_symptoms(req.transcript)
    return {"extracted": data}


@router.post("/clinical-summary")
async def ai_clinical_summary(
    req: CaseAIRequest,
    user: User = Depends(get_current_user)
):
    """
    Generate a concise clinical summary from a completed assessment case.
    Input: full case_data dict (symptoms, vitals, engine output, ML result).
    Output: {summary, important_findings, missing_information, uncertainty_note}
    The LLM only narrates — deterministic risk_level is NOT overridable.
    """
    data = await clinical_summary(req.case_data)
    return {"clinical_summary": data}


@router.post("/case-image-upload")
async def case_image_upload(
    file: UploadFile = File(...),
    case_id: str | None = None,
    patient_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Upload a clinical image and associate it with an AssessmentCase.

    Validates:
      - File type must be image/jpeg, image/jpg, or image/png
      - File size ≤ 10 MB

    The visual analysis model is not validated for diagnostic use.
    If the model is unavailable, the image is stored but analysis is skipped
    and the response clearly states: visual_analysis_available: false.
    """
    # ── File type validation ──────────────────────────────────────────────────
    allowed_types = {"image/jpeg", "image/jpg", "image/png"}
    allowed_exts  = {".jpg", ".jpeg", ".png"}

    content_type = (file.content_type or "").lower()
    ext = Path(file.filename or "img.jpg").suffix.lower()

    if content_type not in allowed_types and ext not in allowed_exts:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{content_type}'. Allowed: JPG, JPEG, PNG."
        )

    # ── Read + size validation ────────────────────────────────────────────────
    MAX_BYTES = 10 * 1024 * 1024  # 10 MB
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"File too large ({len(content) // 1024} KB). Maximum allowed: 10 MB."
        )

    # ── Persist file ──────────────────────────────────────────────────────────
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    fname = f"{uuid.uuid4()}{ext or '.jpg'}"
    fpath = upload_dir / fname
    fpath.write_bytes(content)

    # ── Attempt visual analysis (best-effort, not medically validated) ────────
    analysis_result = None
    visual_analysis_available = False
    analysis_note = (
        "Visual analysis model unavailable. "
        "Image has been stored and can be reviewed by a clinician."
    )

    try:
        from app.ml.skin_detection import analyze_skin_image
        analysis_result = analyze_skin_image(str(fpath))
        visual_analysis_available = True
        analysis_note = (
            "IMPORTANT: This analysis is from a heuristic model, "
            "NOT a validated medical diagnostic tool. "
            "Results must be verified by a qualified clinician."
        )
    except Exception:
        pass  # model unavailable — safe fallback, image is still stored

    # ── Persist record ────────────────────────────────────────────────────────
    img = UploadedImage(
        patient_id=patient_id,
        case_id=case_id,
        uploader_id=user.id,
        image_type="clinical",
        file_path=str(fpath),
        original_filename=file.filename,
        file_size_bytes=len(content),
        model_output=analysis_result,
        confidence=analysis_result.get("confidence") if analysis_result else None,
    )
    db.add(img)
    db.commit()
    db.refresh(img)

    return {
        "image_id": img.id,
        "case_id": case_id,
        "patient_id": patient_id,
        "file_path": str(fpath),
        "file_size_bytes": len(content),
        "visual_analysis_available": visual_analysis_available,
        "analysis_note": analysis_note,
        "analysis": analysis_result,
    }

