from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.patient import Patient
from app.models.ai_prediction import AIPrediction
from app.models.emergency_alert import EmergencyAlert
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.notification import Notification
from app.models.doctor_assignment import DoctorAssignment
from app.websocket.manager import manager

router = APIRouter(tags=["analytics"])


@router.get("/api/analytics")
def dashboard_analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _dashboard_analytics_impl(db, user)
    except Exception as e:
        print(f"Analytics warning: {e}")
        return {
            "totalPatients": 0,
            "totalCases": 0,
            "totalUsers": 0,
            "pendingFollowUps": 0,
            "highRiskCount": 0,
            "mediumRiskCount": 0,
            "lowRiskCount": 0,
            "criticalCases": 0,
            "pendingReviews": 0,
            "closedCasesToday": 0,
            "totalAIPredictions": 0,
            "alertCount": 0,
            "responseRate": 0,
            "patientHealthScore": 50,
            "nextAppointment": None,
            "activePrescriptions": 0,
            "recommendations": [],
            "engineStatus": "degraded",
            "lastSync": __import__("datetime").datetime.utcnow().isoformat(),
            "recommendationsGenerated": 0,
            "recentAlerts": [],
        }


def _dashboard_analytics_impl(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        if not patient:
            return {"message": "Patient profile not found", "patientHealthScore": 0}
        total_patients = 1
        total_predictions = db.query(AIPrediction).filter(AIPrediction.patient_id == patient.id).count()
        highRiskCount = db.query(AIPrediction).filter(AIPrediction.patient_id == patient.id, AIPrediction.risk_level == "Red").count()
        mediumRiskCount = db.query(AIPrediction).filter(AIPrediction.patient_id == patient.id, AIPrediction.risk_level == "Yellow").count()
        lowRiskCount = db.query(AIPrediction).filter(AIPrediction.patient_id == patient.id, AIPrediction.risk_level == "Green").count()
        open_alerts = db.query(EmergencyAlert).filter(EmergencyAlert.patient_id == patient.id, EmergencyAlert.status == "open").count()
        total_alerts = db.query(EmergencyAlert).filter(EmergencyAlert.patient_id == patient.id).count()
        resolved_alerts = db.query(EmergencyAlert).filter(EmergencyAlert.patient_id == patient.id, EmergencyAlert.status != "open").count()
    elif user.role == "PCW":
        total_patients = db.query(Patient).filter(Patient.asha_worker_id == user.id).count()
        total_predictions = db.query(AIPrediction).join(Patient, AIPrediction.patient_id == Patient.id).filter(Patient.asha_worker_id == user.id).count()
        highRiskCount = db.query(AIPrediction).join(Patient, AIPrediction.patient_id == Patient.id).filter(Patient.asha_worker_id == user.id, AIPrediction.risk_level == "Red").count()
        mediumRiskCount = db.query(AIPrediction).join(Patient, AIPrediction.patient_id == Patient.id).filter(Patient.asha_worker_id == user.id, AIPrediction.risk_level == "Yellow").count()
        lowRiskCount = db.query(AIPrediction).join(Patient, AIPrediction.patient_id == Patient.id).filter(Patient.asha_worker_id == user.id, AIPrediction.risk_level == "Green").count()
        open_alerts = db.query(EmergencyAlert).join(Patient, EmergencyAlert.patient_id == Patient.id).filter(Patient.asha_worker_id == user.id, EmergencyAlert.status == "open").count()
        total_alerts = db.query(EmergencyAlert).join(Patient, EmergencyAlert.patient_id == Patient.id).filter(Patient.asha_worker_id == user.id).count()
        resolved_alerts = db.query(EmergencyAlert).join(Patient, EmergencyAlert.patient_id == Patient.id).filter(Patient.asha_worker_id == user.id, EmergencyAlert.status != "open").count()
    elif user.role == "DOCTOR":
        total_patients = db.query(Patient).filter(Patient.doctor_id == user.id).count()
        total_predictions = db.query(AIPrediction).filter(AIPrediction.patient_id == Patient.id).join(Patient).filter(Patient.doctor_id == user.id).count()
        highRiskCount = db.query(AIPrediction).join(Patient, AIPrediction.patient_id == Patient.id).filter(Patient.doctor_id == user.id, AIPrediction.risk_level == "Red").count()
        mediumRiskCount = db.query(AIPrediction).join(Patient, AIPrediction.patient_id == Patient.id).filter(Patient.doctor_id == user.id, AIPrediction.risk_level == "Yellow").count()
        lowRiskCount = db.query(AIPrediction).join(Patient, AIPrediction.patient_id == Patient.id).filter(Patient.doctor_id == user.id, AIPrediction.risk_level == "Green").count()
        open_alerts = db.query(EmergencyAlert).join(Patient, EmergencyAlert.patient_id == Patient.id).filter(Patient.doctor_id == user.id, EmergencyAlert.status == "open").count()
        total_alerts = db.query(EmergencyAlert).join(Patient, EmergencyAlert.patient_id == Patient.id).filter(Patient.doctor_id == user.id).count()
        resolved_alerts = db.query(EmergencyAlert).join(Patient, EmergencyAlert.patient_id == Patient.id).filter(Patient.doctor_id == user.id, EmergencyAlert.status != "open").count()
    else:
        total_patients = db.query(Patient).count()
        total_predictions = db.query(AIPrediction).count()
        highRiskCount = db.query(AIPrediction).filter(AIPrediction.risk_level == "Red").count()
        mediumRiskCount = db.query(AIPrediction).filter(AIPrediction.risk_level == "Yellow").count()
        lowRiskCount = db.query(AIPrediction).filter(AIPrediction.risk_level == "Green").count()
        open_alerts = db.query(EmergencyAlert).filter(EmergencyAlert.status == "open").count()
        total_alerts = db.query(EmergencyAlert).count()
        resolved_alerts = db.query(EmergencyAlert).filter(EmergencyAlert.status != "open").count()

    recent_alerts = db.query(EmergencyAlert).order_by(EmergencyAlert.created_at.desc()).limit(10).all()

    pending_follow_ups = db.query(Appointment).filter(Appointment.status == "scheduled").count()
    active_prescriptions = db.query(Prescription).count()

    # Patient score / next appointment are global fallbacks for the current UI.
    avg_risk = db.query(func.avg(AIPrediction.risk_score)).scalar()
    try:
        avg_risk_val = float(avg_risk) if avg_risk is not None else 30.0
    except Exception:
        avg_risk_val = 30.0
    patientHealthScore = max(0, min(100, int(100 - avg_risk_val)))

    next_appt = (
        db.query(Appointment)
        .filter(Appointment.status == "scheduled")
        .order_by(Appointment.scheduled_at.asc())
        .first()
    )
    nextAppointment = next_appt.scheduled_at.isoformat() if next_appt else None

    recommendations_rows = db.query(AIPrediction).order_by(AIPrediction.created_at.desc()).limit(5).all()
    recommendations = []
    for row in recommendations_rows:
        if not row.recommendations:
            continue
        parts = [p.strip() for p in str(row.recommendations).split(";") if p.strip()]
        for p in parts[:2]:
            recommendations.append({"title": "AI Recommendation", "description": p})
        if len(recommendations) >= 6:
            break

    today = func.curdate()
    closed_cases_today = (
        db.query(EmergencyAlert)
        .filter(EmergencyAlert.status != "open")
        .filter(func.date(EmergencyAlert.created_at) == today)
        .count()
    )

    responseRate = (
        round((resolved_alerts / total_alerts) * 100, 1) if total_alerts > 0 else 0
    )

    # Shape the payload to match the existing React dashboards.
    return {
        "totalPatients": total_patients,
        "totalCases": total_predictions,
        "totalUsers": db.query(User).count(),

        "pendingFollowUps": pending_follow_ups,
        "highRiskCount": highRiskCount,
        "mediumRiskCount": mediumRiskCount,
        "lowRiskCount": lowRiskCount,

        "criticalCases": highRiskCount,
        "pendingReviews": open_alerts,
        "closedCasesToday": closed_cases_today,

        "totalAIPredictions": total_predictions,
        "alertCount": total_alerts,
        "responseRate": responseRate,

        "patientHealthScore": patientHealthScore,
        "nextAppointment": nextAppointment,
        "activePrescriptions": active_prescriptions,
        "recommendations": recommendations,

        "engineStatus": "online",
        "lastSync": __import__("datetime").datetime.utcnow().isoformat(),
        "recommendationsGenerated": total_predictions,

        "recentAlerts": [
            {
                "id": a.id,
                "title": a.alert_type or "Emergency Alert",
                "priority": a.risk_level or "Unknown",
                "details": a.message or "",
                "risk_level": a.risk_level,
                "status": a.status,
                "created_at": str(a.created_at),
            }
            for a in recent_alerts
        ],
    }


@router.get("/api/notifications")
def get_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    notes = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return notes


class AlertActionRequest(BaseModel):
    action: str
    hospital_id: str | None = None
    prescription: dict | None = None
    instructions: str | None = None
    follow_up_date: str | None = None
    patient_status: str | None = None
    notes: str | None = None


def _serialize_alert(alert: EmergencyAlert, db: Session) -> dict:
    patient = None
    triggered_by = None
    assigned_doctor = None
    ai_predictions = []
    uploaded_images = []
    
    if alert.patient_id:
        patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()
        # Get latest AI predictions for context
        predictions = db.query(AIPrediction).filter(
            AIPrediction.patient_id == alert.patient_id
        ).order_by(AIPrediction.created_at.desc()).limit(5).all()
        ai_predictions = [
            {
                "id": p.id,
                "model_type": p.model_type,
                "probable_condition": p.probable_condition,
                "risk_level": p.risk_level,
                "risk_score": p.risk_score,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in predictions
        ]
        
        # Get uploaded images
        from app.models.uploaded_image import UploadedImage
        images = db.query(UploadedImage).filter(
            UploadedImage.patient_id == alert.patient_id
        ).order_by(UploadedImage.created_at.desc()).limit(5).all()
        uploaded_images = [
            {
                "id": img.id,
                "image_type": img.image_type,
                "file_path": img.file_path,
                "confidence": img.confidence,
                "created_at": img.created_at.isoformat() if img.created_at else None,
            }
            for img in images
        ]
    
    if alert.triggered_by_user_id:
        triggered_by = db.query(User).filter(User.id == alert.triggered_by_user_id).first()
    if patient and patient.doctor_id:
        assigned_doctor = db.query(User).filter(User.id == patient.doctor_id).first()

    return {
        "id": alert.id,
        "patient_id": alert.patient_id,
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "village": patient.village,
            "health_id": patient.health_id,
            "risk_level": patient.risk_level,
        } if patient else None,
        "triggered_by_user_id": alert.triggered_by_user_id,
        "triggered_by": {
            "id": triggered_by.id,
            "name": triggered_by.name,
            "role": triggered_by.role,
        } if triggered_by else None,
        "assigned_doctor": {
            "id": assigned_doctor.id,
            "name": assigned_doctor.name,
        } if assigned_doctor else None,
        "risk_level": alert.risk_level,
        "status": alert.status,
        "alert_type": alert.alert_type,
        "message": alert.message,
        "hospital_id": alert.hospital_id,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "meta": alert.meta,
        "ai_predictions": ai_predictions,
        "uploaded_images": uploaded_images,
    }


@router.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db), user: User = Depends(require_roles("DOCTOR", "ADMIN", "PCW"))):
    q = db.query(EmergencyAlert).order_by(EmergencyAlert.created_at.desc())
    if user.role == "PCW":
        q = q.filter(EmergencyAlert.triggered_by_user_id == user.id)
    alerts = q.limit(50).all()
    return [_serialize_alert(alert, db) for alert in alerts]


@router.post("/api/alerts/{alert_id}/action")
async def alert_action(
    alert_id: str,
    data: AlertActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("DOCTOR", "ADMIN", "SPECIALIST")),
):
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    patient = None
    if alert.patient_id:
        patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()

    if data.action == "accept":
        alert.status = "accepted"
        if patient and user.role in ("DOCTOR", "SPECIALIST"):
            patient.doctor_id = user.id
        assignment = DoctorAssignment(
            patient_id=alert.patient_id,
            doctor_id=user.id,
            alert_id=alert.id,
            status="accepted",
            notes=data.notes,
        )
        db.add(assignment)
    elif data.action == "reject":
        alert.status = "rejected"
        assignment = DoctorAssignment(
            patient_id=alert.patient_id,
            doctor_id=user.id,
            alert_id=alert.id,
            status="rejected",
            notes=data.notes,
        )
        db.add(assignment)
    elif data.action in ("resolve", "closed", "complete"):
        alert.status = "closed"
        alert.resolved_at = datetime.utcnow()
    if data.hospital_id:
        alert.hospital_id = data.hospital_id
    if data.patient_status and patient:
        patient.risk_level = data.patient_status
    if data.prescription and patient:
        db.add(
            Prescription(
                patient_id=patient.id,
                doctor_id=user.id,
                medications=data.prescription,
                instructions=data.instructions,
                follow_up_date=datetime.fromisoformat(data.follow_up_date) if data.follow_up_date else None,
            )
        )
    if user.role == "DOCTOR" and alert.patient_id:
        db.add(Notification(user_id=alert.triggered_by_user_id, title="Doctor update", body=f"Doctor {user.name} {data.action} the alert.", type="doctor_action", related_alert_id=alert.id))
    db.commit()
    db.refresh(alert)
    try:
        serialized = _serialize_alert(alert, db)
    except Exception:
        serialized = {"id": alert.id, "status": alert.status, "patient_id": alert.patient_id}
    await manager.broadcast_alert({"type": "alert_update", "alert": serialized}, roles=["PCW", "ASHA_WORKER", "DOCTOR", "PATIENT", "ADMIN"])
    return {"status": alert.status, "alert_id": alert.id, "patient_id": alert.patient_id}


@router.get("/api/prescriptions")
def prescriptions(
    patient_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.prescription import Prescription

    q = db.query(Prescription)
    if patient_id:
        q = q.filter(Prescription.patient_id == patient_id)
    return q.order_by(Prescription.created_at.desc()).limit(50).all()


@router.get("/api/appointments")
def appointments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Appointment)
    if user.role == "DOCTOR":
        q = q.filter(Appointment.doctor_id == user.id)
    return q.order_by(Appointment.scheduled_at.desc()).limit(50).all()
