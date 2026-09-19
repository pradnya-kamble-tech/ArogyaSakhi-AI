import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("patients.id"), nullable=True, index=True)
    uploader_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    image_type: Mapped[str] = mapped_column(String(64), default="skin")
    file_path: Mapped[str] = mapped_column(String(512))
    model_output: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
