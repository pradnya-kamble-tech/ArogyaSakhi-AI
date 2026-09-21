import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("patients.id"), nullable=True, index=True)
    # case_id links the image directly to an AssessmentCase (added in v2)
    case_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    uploader_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    image_type: Mapped[str] = mapped_column(String(64), default="clinical")
    file_path: Mapped[str] = mapped_column(String(512))
    original_filename: Mapped[str | None] = mapped_column(String(256), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(nullable=True)
    model_output: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
