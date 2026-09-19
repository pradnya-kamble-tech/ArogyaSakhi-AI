from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    health_id: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    is_pregnant: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    emergency_contact: Optional[dict] = None


class PatientResponse(PatientCreate):
    id: str
    user_id: Optional[str] = None
    risk_level: Optional[str] = "Green"
    asha_worker_id: Optional[str] = None
    doctor_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
