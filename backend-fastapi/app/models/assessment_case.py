import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class AssessmentCase(Base):
    __tablename__ = "assessment_cases"
    
    client_uuid: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    patient_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    patient_age: Mapped[str | None] = mapped_column(String(32), nullable=True)
    worker_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    inputs: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    engine_output: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    escalation: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending_review")
    doctor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    final_diagnosis: Mapped[str | None] = mapped_column(String(256), nullable=True)
    doctor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    referral_facility: Mapped[str | None] = mapped_column(String(256), nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # Priority derived from deterministic risk rules at sync time
    # Values: CRITICAL | HIGH | MEDIUM | NORMAL
    priority: Mapped[str] = mapped_column(String(16), default="NORMAL")
    # updated_at for downstream sync conflict detection
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
