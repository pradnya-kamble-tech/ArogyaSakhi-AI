import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PatientVisit(Base):
    __tablename__ = "patient_visits"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String(64), ForeignKey("patients.id"), index=True)
    asha_worker_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    vitals: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    symptoms: Mapped[list | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
