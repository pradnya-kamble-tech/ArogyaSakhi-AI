from pydantic import BaseModel
from typing import Optional, List


class SymptomCheckRequest(BaseModel):
    symptoms: List[str]
    age: int
    gender: Optional[str] = "unknown"
    severity: str = "moderate"
    duration: int = 1
    vitals: Optional[dict] = None
    patient_id: Optional[str] = None
    is_pregnant: bool = False
    medical_history: Optional[List[str]] = None
    anatomy_part: Optional[str] = None
    anatomy_view: Optional[str] = None
    anatomy_gender: Optional[str] = None
    voice_transcript: Optional[str] = None
    voice_language: Optional[str] = None
    chat_log: Optional[List[dict]] = None
    patient_context: Optional[dict] = None


class VoiceIntentRequest(BaseModel):
    transcript: str
    language: str = "en"
    patient_id: Optional[str] = None


class SOSRequest(BaseModel):
    patient_id: Optional[str] = None
    message: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    symptoms: Optional[List[str]] = None
    anatomy_part: Optional[str] = None
    images: Optional[List[str]] = None
    ai_result: Optional[dict] = None
    asha_name: Optional[str] = None


class ChatRequest(BaseModel):
    patient_id: Optional[str] = None
    message: str
    chat_history: Optional[List[dict]] = None


class AlertActionRequest(BaseModel):
    action: str
    hospital_id: Optional[str] = None
    prescription: Optional[dict] = None
    instructions: Optional[str] = None
    follow_up_date: Optional[str] = None
    patient_status: Optional[str] = None
    notes: Optional[str] = None
