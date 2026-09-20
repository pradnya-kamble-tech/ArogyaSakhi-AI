from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import OperationalError
from .config import get_settings

settings = get_settings()

# Try to connect to MySQL; if it's unreachable, fall back to a local SQLite file
def _create_engine_with_fallback():
    try:
        e = create_engine(settings.database_url, pool_pre_ping=True, pool_recycle=3600)
        # test connection
        with e.connect() as conn:
            conn.execute(text("SELECT 1"))
            # test if JSON is supported
            try:
                conn.execute(text("CREATE TEMPORARY TABLE _test_json (data JSON)"))
            except Exception:
                raise OperationalError("JSON not supported by this DB version", None, None)
        return e
    except Exception:
        # fallback to sqlite in the current backend-fastapi folder
        fallback_url = "sqlite:///./dev.db"
        e = create_engine(fallback_url, connect_args={"check_same_thread": False})
        return e


engine = _create_engine_with_fallback()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _column_exists(table: str, column: str) -> bool:
    insp = inspect(engine)
    if table not in insp.get_table_names():
        return False
    return column in {c["name"] for c in insp.get_columns(table)}


def _foreign_key_exists(table: str, constraint_name: str) -> bool:
    insp = inspect(engine)
    if table not in insp.get_table_names():
        return False
    return any(fk["name"] == constraint_name for fk in insp.get_foreign_keys(table))


def _add_column_if_missing(table: str, column: str, ddl: str):
    if not _column_exists(table, column):
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE `{table}` ADD COLUMN {ddl}"))


def _ensure_column_nullable(table: str, column: str, ddl: str = "VARCHAR(64) NULL"):
    insp = inspect(engine)
    if table not in insp.get_table_names():
        return
    for col in insp.get_columns(table):
        if col["name"] == column and not col["nullable"]:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE `{table}` MODIFY COLUMN `{column}` {ddl}"))
            break


def _parse_fk_column(ddl: str) -> str | None:
    token = "FOREIGN KEY"
    if token not in ddl:
        return None
    start = ddl.index(token) + len(token)
    rest = ddl[start:].strip()
    if rest.startswith("(") and ")" in rest:
        return rest[1:rest.index(")")].strip(' `')
    return None


def _add_foreign_key_if_missing(table: str, constraint_name: str, ddl: str):
    if not _foreign_key_exists(table, constraint_name):
        col = _parse_fk_column(ddl)
        if col:
            _ensure_column_nullable(table, col)
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE `{table}` ADD CONSTRAINT `{constraint_name}` {ddl}"))


def migrate_schema():
    """Align legacy Node/MySQL tables with FastAPI SQLAlchemy models."""
    insp = inspect(engine)
    tables = insp.get_table_names()

    user_cols = {
        "email": "email VARCHAR(256) NULL",
        "phone": "phone VARCHAR(64) NULL",
        "language": "language VARCHAR(32) DEFAULT 'en'",
        "latitude": "latitude FLOAT NULL",
        "longitude": "longitude FLOAT NULL",
        "address": "address TEXT NULL",
    }
    if "users" in tables:
        for col, ddl in user_cols.items():
            _add_column_if_missing("users", col, ddl)

    patient_cols = {
        "user_id": "user_id VARCHAR(64) NULL",
        "email": "email VARCHAR(128) NULL",
        "is_pregnant": "is_pregnant TINYINT(1) DEFAULT 0",
        "risk_level": "risk_level VARCHAR(16) DEFAULT 'Green'",
        "asha_worker_id": "asha_worker_id VARCHAR(64) NULL",
        "doctor_id": "doctor_id VARCHAR(64) NULL",
        "latitude": "latitude FLOAT NULL",
        "longitude": "longitude FLOAT NULL",
        "emergency_contact": "emergency_contact JSON NULL",
        "created_by": "created_by VARCHAR(64) NULL",
    }
    if "patients" in tables:
        for col, ddl in patient_cols.items():
            _add_column_if_missing("patients", col, ddl)
        _add_foreign_key_if_missing(
            "patients",
            "fk_patients_user_id",
            "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL",
        )
        _add_foreign_key_if_missing(
            "patients",
            "fk_patients_asha_worker_id",
            "FOREIGN KEY (asha_worker_id) REFERENCES users(id) ON DELETE SET NULL",
        )
        _add_foreign_key_if_missing(
            "patients",
            "fk_patients_doctor_id",
            "FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL",
        )
        _add_foreign_key_if_missing(
            "patients",
            "fk_patients_created_by",
            "FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL",
        )

    ai_prediction_cols = {
        "patient_id": "patient_id VARCHAR(64) NULL",
        "user_id": "user_id VARCHAR(64) NULL",
    }
    if "ai_predictions" in tables:
        for col, ddl in ai_prediction_cols.items():
            _add_column_if_missing("ai_predictions", col, ddl)
        _add_foreign_key_if_missing(
            "ai_predictions",
            "fk_ai_predictions_patient_id",
            "FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL",
        )
        _add_foreign_key_if_missing(
            "ai_predictions",
            "fk_ai_predictions_user_id",
            "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL",
        )

    emergency_alert_cols = {
        "patient_id": "patient_id VARCHAR(64) NULL",
        "triggered_by_user_id": "triggered_by_user_id VARCHAR(64) NULL",
        "hospital_id": "hospital_id VARCHAR(64) NULL",
    }
    if "emergency_alerts" in tables:
        for col, ddl in emergency_alert_cols.items():
            _add_column_if_missing("emergency_alerts", col, ddl)
        _add_foreign_key_if_missing(
            "emergency_alerts",
            "fk_emergency_alerts_patient_id",
            "FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL",
        )
        _add_foreign_key_if_missing(
            "emergency_alerts",
            "fk_emergency_alerts_triggered_by_user_id",
            "FOREIGN KEY (triggered_by_user_id) REFERENCES users(id) ON DELETE SET NULL",
        )

    patient_visit_cols = {
        "patient_id": "patient_id VARCHAR(64) NULL",
        "asha_worker_id": "asha_worker_id VARCHAR(64) NULL",
    }
    if "patient_visits" in tables:
        for col, ddl in patient_visit_cols.items():
            _add_column_if_missing("patient_visits", col, ddl)
        _add_foreign_key_if_missing(
            "patient_visits",
            "fk_patient_visits_patient_id",
            "FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE",
        )
        _add_foreign_key_if_missing(
            "patient_visits",
            "fk_patient_visits_asha_worker_id",
            "FOREIGN KEY (asha_worker_id) REFERENCES users(id) ON DELETE SET NULL",
        )

    uploaded_image_cols = {
        "patient_id": "patient_id VARCHAR(64) NULL",
        "uploader_id": "uploader_id VARCHAR(64) NULL",
    }
    if "uploaded_images" in tables:
        for col, ddl in uploaded_image_cols.items():
            _add_column_if_missing("uploaded_images", col, ddl)
        _add_foreign_key_if_missing(
            "uploaded_images",
            "fk_uploaded_images_patient_id",
            "FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL",
        )
        _add_foreign_key_if_missing(
            "uploaded_images",
            "fk_uploaded_images_uploader_id",
            "FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL",
        )

    voice_log_cols = {
        "user_id": "user_id VARCHAR(64) NULL",
        "related_patient_id": "related_patient_id VARCHAR(64) NULL",
    }
    if "voice_logs" in tables:
        for col, ddl in voice_log_cols.items():
            _add_column_if_missing("voice_logs", col, ddl)
        _add_foreign_key_if_missing(
            "voice_logs",
            "fk_voice_logs_user_id",
            "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL",
        )
        _add_foreign_key_if_missing(
            "voice_logs",
            "fk_voice_logs_related_patient_id",
            "FOREIGN KEY (related_patient_id) REFERENCES patients(id) ON DELETE SET NULL",
        )

    appointment_cols = {
        "patient_id": "patient_id VARCHAR(64) NULL",
        "doctor_id": "doctor_id VARCHAR(64) NULL",
    }
    if "appointments" in tables:
        for col, ddl in appointment_cols.items():
            _add_column_if_missing("appointments", col, ddl)
        _add_foreign_key_if_missing(
            "appointments",
            "fk_appointments_patient_id",
            "FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE",
        )
        _add_foreign_key_if_missing(
            "appointments",
            "fk_appointments_doctor_id",
            "FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL",
        )

    prescription_cols = {
        "patient_id": "patient_id VARCHAR(64) NULL",
        "doctor_id": "doctor_id VARCHAR(64) NULL",
    }
    if "prescriptions" in tables:
        for col, ddl in prescription_cols.items():
            _add_column_if_missing("prescriptions", col, ddl)
        _add_foreign_key_if_missing(
            "prescriptions",
            "fk_prescriptions_patient_id",
            "FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE",
        )
        _add_foreign_key_if_missing(
            "prescriptions",
            "fk_prescriptions_doctor_id",
            "FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL",
        )

    notification_cols = {
        "user_id": "user_id VARCHAR(64) NULL",
        "related_alert_id": "related_alert_id VARCHAR(64) NULL",
    }
    if "notifications" in tables:
        for col, ddl in notification_cols.items():
            _add_column_if_missing("notifications", col, ddl)
        _add_foreign_key_if_missing(
            "notifications",
            "fk_notifications_user_id",
            "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        )
        _add_foreign_key_if_missing(
            "notifications",
            "fk_notifications_related_alert_id",
            "FOREIGN KEY (related_alert_id) REFERENCES emergency_alerts(id) ON DELETE SET NULL",
        )

    hospital_cols = {
        "type": "type VARCHAR(64) NULL",
        "has_icu": "has_icu TINYINT(1) DEFAULT 0",
        "has_maternity": "has_maternity TINYINT(1) DEFAULT 0",
        "has_ambulance": "has_ambulance TINYINT(1) DEFAULT 1",
    }
    if "hospitals" in tables:
        for col, ddl in hospital_cols.items():
            _add_column_if_missing("hospitals", col, ddl)

    symptom_cols = {
        "body_region": "body_region VARCHAR(128) NULL",
    }
    if "symptoms" in tables:
        for col, ddl in symptom_cols.items():
            _add_column_if_missing("symptoms", col, ddl)


def init_db():
    from app.models import (  # noqa: F401
        user,
        patient,
        hospital,
        appointment,
        prescription,
        emergency_alert,
        ai_prediction,
        patient_visit,
        activity_log,
        notification,
        uploaded_image,
        voice_log,
        health_report,
        chat_log,
        doctor_assignment,
        symptom,
        doctor_profile,
        refresh_token,
        assessment_case,
    )

    # Try to create the MySQL database if reachable; otherwise fall back.
    try:
        root_url = (
            f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/"
        )
        root_engine = create_engine(root_url, isolation_level="AUTOCOMMIT")

        if getattr(settings, "RESET_DB", False):
            with root_engine.connect() as conn:
                conn.execute(text(f"DROP DATABASE IF EXISTS `{settings.DB_NAME}`"))
                conn.execute(
                    text(
                        f"CREATE DATABASE `{settings.DB_NAME}` "
                        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                    )
                )
        else:
            with root_engine.connect() as conn:
                conn.execute(
                    text(f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` CHARACTER SET utf8mb4")
                )

        root_engine.dispose()
        print(f"DATABASE: Successfully connected to MySQL at {settings.DB_HOST}:{settings.DB_PORT}")
    except OperationalError:
        # MySQL not reachable; running in fallback sqlite mode. Continue.
        print(f"DATABASE: MySQL unreachable at {settings.DB_HOST}:{settings.DB_PORT}. Falling back to SQLite dev.db.")
        pass

    # Ensure models are created on the selected engine (MySQL or fallback sqlite)
    Base.metadata.create_all(bind=engine)

    # Attempt to migrate schema if using MySQL (best-effort)
    try:
        if not getattr(settings, "RESET_DB", False):
            migrate_schema()
    except OperationalError:
        # If migration fails (e.g., sqlite or MySQL not available), ignore.
        return
