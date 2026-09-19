from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.hospital import Hospital
from app.models.symptom import Symptom
from app.models.patient import Patient


def seed_database():
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        users = [
            User(username="pcw1", password_hash=hash_password("pcw123"), name="ASHA Worker Priya", role="PCW", facility="PHC Andheri"),
            User(username="asha1", password_hash=hash_password("asha123"), name="ASHA Worker Sunita", role="PCW", facility="PHC Pune Rural"),
            User(username="doctor1", password_hash=hash_password("doc123"), name="Dr. Sharma", role="DOCTOR", specialty="General Medicine", facility="District Hospital"),
            User(username="patient1", password_hash=hash_password("pat123"), name="Ramesh Kumar", role="PATIENT", phone="9876543210"),
            User(username="admin", password_hash=hash_password("admin123"), name="System Admin", role="ADMIN", facility="Central Office"),
        ]
        db.add_all(users)
        db.flush()

        patient_user = db.query(User).filter(User.username == "patient1").first()
        if patient_user:
            db.add(
                Patient(
                    user_id=patient_user.id,
                    name=patient_user.name,
                    phone=patient_user.phone,
                    health_id="HID-0001",
                    risk_level="Green",
                    created_by=patient_user.id,
                )
            )

        hospitals = [
            Hospital(name="District Civil Hospital", type="government", city="Pune", state="Maharashtra", phone="020-1234567", latitude=18.5204, longitude=73.8567, has_icu=True, has_maternity=True, has_ambulance=True, capacity=500),
            Hospital(name="Rural Primary Health Centre", type="phc", city="Baramati", state="Maharashtra", phone="02112-234567", latitude=18.1510, longitude=74.5772, has_maternity=True, has_ambulance=True, capacity=50),
            Hospital(name="Apollo Clinic Pune", type="private", city="Pune", state="Maharashtra", phone="020-9876543", latitude=18.5362, longitude=73.8958, has_icu=True, has_ambulance=True, capacity=120),
            Hospital(name="Emergency Care Centre", type="emergency", city="Mumbai", state="Maharashtra", phone="022-1111111", latitude=19.0760, longitude=72.8777, has_icu=True, has_ambulance=True, capacity=200),
        ]
        db.add_all(hospitals)

        symptoms = [
            Symptom(name="Fever", category="general"),
            Symptom(name="Cough", category="respiratory"),
            Symptom(name="Breathlessness", category="respiratory"),
            Symptom(name="Chest Pain", category="cardiac"),
            Symptom(name="Rash", category="skin"),
            Symptom(name="Diarrhea", category="gi"),
            Symptom(name="Vomiting", category="gi"),
            Symptom(name="Headache", category="neurological"),
        ]
        db.add_all(symptoms)

        asha = db.query(User).filter(User.username == "pcw1").first()
        patients = [
            Patient(name="Lakshmi Devi", age=34, gender="female", village="Wagholi", district="Pune", phone="9123456780", health_id="HID-001", risk_level="Green", is_pregnant=True, asha_worker_id=asha.id if asha else None),
            Patient(name="Suresh Patil", age=45, gender="male", village="Baramati", district="Pune", phone="9123456781", health_id="HID-002", risk_level="Yellow", asha_worker_id=asha.id if asha else None),
            Patient(name="Anita Joshi", age=28, gender="female", village="Hadapsar", district="Pune", phone="9123456782", health_id="HID-003", risk_level="Green", asha_worker_id=asha.id if asha else None),
        ]
        db.add_all(patients)
        db.commit()
        print("Database seeded with demo users, hospitals, and patients")
    finally:
        db.close()
