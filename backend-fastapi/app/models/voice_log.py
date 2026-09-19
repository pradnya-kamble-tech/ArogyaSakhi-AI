import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class VoiceLog(Base):
    __tablename__ = "voice_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    transcript: Mapped[str] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(16), default="en")
    intent: Mapped[str | None] = mapped_column(String(128), nullable=True)
    action_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    related_patient_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
