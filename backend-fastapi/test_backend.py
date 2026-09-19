import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.models import (user, hospital, symptom, patient, patient_visit, emergency_alert, prescription, appointment, ai_prediction, notification)

def test_backend():
    print("--- Database Table Counts ---")
    db = SessionLocal()
    try:
        tables = [
            user.User, hospital.Hospital, symptom.Symptom, patient.Patient, 
            patient_visit.PatientVisit, emergency_alert.EmergencyAlert, 
            prescription.Prescription, appointment.Appointment, 
            ai_prediction.AIPrediction, notification.Notification
        ]
        for tbl in tables:
            print(f"{tbl.__tablename__}: {db.query(tbl).count()}")
    finally:
        db.close()
        
    print("\n--- Testing API Endpoints ---")
    client = TestClient(app)
    users = [
        ("admin", "admin123"),
        ("doctor1", "doc123"),
        ("pcw1", "pcw123"),
        ("asha1", "asha123"),
        ("patient1", "pat123")
    ]
    
    for username, password in users:
        response = client.post("/api/v1/auth/login", data={"username": username, "password": password})
        if response.status_code == 200:
            print(f"Login SUCCESS for {username}")
            token = response.json().get("access_token")
            
            if username in ["admin", "doctor1"]:
                patient_res = client.get("/api/v1/patients", headers={"Authorization": f"Bearer {token}"})
                if patient_res.status_code == 200:
                    data = patient_res.json()
                    count = len(data.get("patients", data))
                    print(f"  -> GET /patients for {username} returned {count} rows. (Success: {count >= 40})")
                else:
                    print(f"  -> GET /patients failed for {username}: {patient_res.text}")
        else:
            print(f"Login FAILED for {username}: {response.text}")

if __name__ == "__main__":
    test_backend()
