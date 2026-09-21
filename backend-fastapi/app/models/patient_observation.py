"""
PatientObservation — one row per clinical observation event.
Stores vitals captured during an AssessmentCase or PatientVisit.
Used for physiological trend analysis.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class PatientObservation(Base):
    __tablename__ = "patient_observations"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # Link to the assessment case that produced this observation
    case_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    # Link to patient (optional — cases may not always have a patient_id)
    patient_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    # Who recorded this observation
    worker_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Vital signs — all nullable so partial observations are valid
    bp_systolic: Mapped[float | None] = mapped_column(Float, nullable=True)
    bp_diastolic: Mapped[float | None] = mapped_column(Float, nullable=True)
    heart_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)   # Fahrenheit
    spo2: Mapped[float | None] = mapped_column(Float, nullable=True)          # %
    respiratory_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    blood_sugar: Mapped[float | None] = mapped_column(Float, nullable=True)   # mg/dL
    hb: Mapped[float | None] = mapped_column(Float, nullable=True)            # g/dL

    # Derived from the deterministic engine at the time of capture
    risk_level: Mapped[str | None] = mapped_column(String(32), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
