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
from app.models.voice_log import VoiceLog
from app.models.activity_log import ActivityLog
from app.schemas.ai import SymptomCheckRequest, VoiceIntentRequest, SOSRequest, ChatRequest
from app.ml.risk_engine import evaluate_risk
from app.ml.skin_detection import analyze_skin_image
from app.ml.voice_intent import classify_intent
from app.ml.chatbot import generate_patient_chat_response
from app.websocket.manager import manager
from app.api.v1.analytics import _serialize_alert

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
