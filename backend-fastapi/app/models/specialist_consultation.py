import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class SpecialistConsultation(Base):
    __tablename__ = "specialist_consultations"
    
    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String(64), index=True)
    requesting_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"))
    specialist_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(32), default="NORMAL")
    reason: Mapped[str] = mapped_column(Text)
    handover_note: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    specialist_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    specialist_review_timestamp: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
