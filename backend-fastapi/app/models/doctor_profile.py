import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class DoctorProfile(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    hospital_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(256), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(128), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
