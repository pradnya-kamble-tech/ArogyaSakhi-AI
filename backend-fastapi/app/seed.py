import argparse
import sys
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from faker import Faker
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.hospital import Hospital
from app.models.symptom import Symptom
from app.models.patient import Patient
from app.models.patient_visit import PatientVisit
from app.models.emergency_alert import EmergencyAlert
from app.models.prescription import Prescription
from app.models.appointment import Appointment
from app.models.ai_prediction import AIPrediction
from app.models.notification import Notification

fake = Faker('en_IN')
Faker.seed(42)
random.seed(42)

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)

def seed_database(reset: bool = False):
    db: Session = SessionLocal()
    try:
        if reset:
            reset_database()
        elif db.query(User).count() > 0:
            print("Database already seeded. Run with --reset to wipe and re-seed.")
            return

        print("Generating synthetic demo data...")

        # 1 Admin, 3 Doctors, 5 ASHA workers
        users = [
            User(username="admin", password_hash=hash_password("admin123"), name="System Admin", role="ADMIN", facility="Central Office"),
            User(username="doctor1", password_hash=hash_password("doc123"), name="Dr. Sharma", role="DOCTOR", specialty="General Medicine", facility="District Hospital"),
            User(username="doctor2", password_hash=hash_password("doc123"), name="Dr. Iyer", role="DOCTOR", specialty="Pediatrics", facility="Rural PHC"),
            User(username="doctor3", password_hash=hash_password("doc123"), name="Dr. Desai", role="DOCTOR", specialty="OB/GYN", facility="Apollo Clinic"),
            User(username="pcw1", password_hash=hash_password("pcw123"), name="ASHA Worker Priya", role="PCW", facility="PHC Andheri"),
            User(username="asha1", password_hash=hash_password("asha123"), name="ASHA Worker Sunita", role="PCW", facility="PHC Pune Rural"),
            User(username="asha2", password_hash=hash_password("asha123"), name="ASHA Worker Kavita", role="PCW", facility="PHC Baramati"),
            User(username="asha3", password_hash=hash_password("asha123"), name="ASHA Worker Anjali", role="PCW", facility="PHC Wagholi"),
            User(username="asha4", password_hash=hash_password("asha123"), name="ASHA Worker Lakshmi", role="PCW", facility="PHC Hadapsar"),
            User(username="patient1", password_hash=hash_password("pat123"), name="Ramesh Kumar", role="PATIENT", phone="9876543210"),
        ]
        db.add_all(users)
        db.flush()

        docs = [u for u in users if u.role == "DOCTOR"]
        ashas = [u for u in users if u.role == "PCW"]

        # 6-8 hospitals/PHCs
        hospital_names = ["District Civil Hospital", "Sanjeevani Clinic", "Rural Health Centre", "Lifeline Hospital", "City Care", "Navjeevan Trust Hospital"]
        hospitals = []
        for h_name in hospital_names:
            h = Hospital(
                name=h_name, type=random.choice(["government", "private", "phc"]), city=fake.city(), state="Maharashtra",
                phone=fake.phone_number()[:15], latitude=random.uniform(18.0, 19.5), longitude=random.uniform(73.0, 75.0),
                has_icu=random.choice([True, False]), has_maternity=random.choice([True, False]), has_ambulance=True,
                capacity=random.randint(10, 500)
            )
            hospitals.append(h)
        db.add_all(hospitals)
        db.flush()

        # 40 symptoms
        symptom_data = [
            ("Fever", "general", "head"), ("Cough", "respiratory", "chest"), ("Breathlessness", "respiratory", "chest"),
            ("Chest Pain", "cardiac", "chest"), ("Headache", "neurological", "head"), ("Rash", "skin", "skin"),
            ("Diarrhea", "gi", "abdomen"), ("Vomiting", "gi", "abdomen"), ("Abdominal Pain", "gi", "abdomen"),
            ("Fatigue", "general", "general"), ("Body Ache", "musculoskeletal", "general"), ("Sore Throat", "ent", "head"),
            ("Joint Pain", "musculoskeletal", "legs"), ("Nausea", "gi", "abdomen"), ("Dizziness", "neurological", "head"),
            ("Confusion", "neurological", "head"), ("Swelling", "general", "legs"), ("Palpitations", "cardiac", "chest"),
            ("High BP", "cardiovascular", "general")
        ]
        
        while len(symptom_data) < 40:
             cat = random.choice(["general", "respiratory", "gi", "neurological", "cardiac", "skin"])
             reg = random.choice(["head", "chest", "abdomen", "arms", "legs", "skin", "general"])
             symptom_data.append((fake.word().capitalize() + " Pain", cat, reg))
             
        symptoms = [Symptom(name=n, category=c, body_region=r) for n,c,r in symptom_data[:40]]
        db.add_all(symptoms)
        db.flush()

        # 40 patients across villages
        villages = ["Wagholi", "Baramati", "Hadapsar", "Shirur", "Khed", "Bhor"]
        patients = []
        # Add the fixed patient1 first
        p1 = Patient(
            user_id=users[-1].id, name=users[-1].name, phone=users[-1].phone, health_id="HID-0001",
            risk_level="Green", district="Pune", village=random.choice(villages), age=45, gender="male",
            created_by=users[0].id, asha_worker_id=random.choice(ashas).id, doctor_id=random.choice(docs).id
        )
        patients.append(p1)
        
        for i in range(2, 41):
            is_female = random.choice([True, False])
            age = random.randint(1, 80)
            is_pregnant = False
            if is_female and 18 <= age <= 45:
                is_pregnant = True if random.random() < (5.0 / 12.0) else False # approx 5 pregnant out of 12 eligible women
                
            p = Patient(
                name=fake.name_female() if is_female else fake.name_male(),
                age=age, gender="female" if is_female else "male",
                village=random.choice(villages), district="Pune", phone=fake.phone_number()[:15],
                health_id=f"HID-{i:04d}",
                risk_level=random.choices(["Green", "Yellow", "Red"], weights=[0.60, 0.25, 0.15])[0],
                is_pregnant=is_pregnant,
                asha_worker_id=random.choice(ashas).id,
                doctor_id=random.choice(docs).id
            )
            patients.append(p)
        db.add_all(patients)
        db.flush()

        # Visits (3-6 weeks, 2-6 visits each)
        for p in patients:
            num_visits = random.randint(2, 6)
            for v_idx in range(num_visits):
                visit_date = datetime.utcnow() - timedelta(days=random.randint(1, 40))
                visit = PatientVisit(
                    patient_id=p.id,
                    asha_worker_id=p.asha_worker_id,
                    created_at=visit_date,
                    notes=fake.sentence(),
                    vitals={
                        "blood_pressure_systolic": random.randint(100, 150),
                        "blood_pressure_diastolic": random.randint(60, 100),
                        "heart_rate": random.randint(60, 120),
                        "temperature": round(random.uniform(97.0, 102.0), 1),
                        "spo2": random.randint(85, 100),
                        "respiratory_rate": random.randint(12, 28)
                    },
                    symptoms=["Fever"] if random.random() > 0.5 else ["Cough"]
                )
                db.add(visit)
                
                # Mock AI Predictions matching the risk level sometimes
                pred = AIPrediction(
                    patient_id=p.id,
                    user_id=p.asha_worker_id,
                    risk_score=random.uniform(0.1, 0.9),
                    risk_level=p.risk_level,
                    model_type="demo-faker",
                    recommendations="Monitor vitals; Rest; Hydrate",
                    created_at=visit_date
                )
                db.add(pred)

        db.flush()

        # 15 emergency alerts with prescriptions and appointments
        for _ in range(15):
            alert_p = random.choice(patients)
            status = random.choice(["open", "accepted", "rejected", "resolved"])
            alert = EmergencyAlert(
                patient_id=alert_p.id,
                triggered_by_user_id=alert_p.asha_worker_id,
                hospital_id=random.choice(hospitals).id,
                message=fake.sentence(),
                status=status,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10))
            )
            db.add(alert)
            db.flush()
            
            # Notifications
            notif = Notification(
                user_id=alert_p.doctor_id,
                title=f"Alert for {alert_p.name}",
                body=alert.message,
                type="ALERT",
                related_alert_id=alert.id,
                is_read=random.choice([True, False])
            )
            db.add(notif)
            
            # Prescriptions and appointments if accepted/resolved
            if status in ["accepted", "resolved"]:
                presc = Prescription(
                    patient_id=alert_p.id,
                    doctor_id=alert_p.doctor_id,
                    medications={"meds": ["Paracetamol 500mg", "Amoxicillin 250mg"]},
                    instructions="Take after food",
                    created_at=alert.created_at + timedelta(hours=1)
                )
                db.add(presc)
                
                appt = Appointment(
                    patient_id=alert_p.id,
                    doctor_id=alert_p.doctor_id,
                    scheduled_at=alert.created_at + timedelta(days=2),
                    status="scheduled"
                )
                db.add(appt)

        db.commit()
        
        print("Database seeded with synthetic demo data (1 Admin, 3 Doctors, 5 ASHA, 40 Patients)")
        print("Note: All seeded data is purely synthetic.")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed ArogyaSakhi AI Data")
    parser.add_argument("--reset", action="store_true", help="Drop everything and re-seed from scratch")
    args = parser.parse_args()
    seed_database(reset=args.reset)
