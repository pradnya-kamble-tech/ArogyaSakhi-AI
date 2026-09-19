from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    username: str
    password: str = Field(min_length=6)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "PATIENT"
    facility: Optional[str] = None
    specialty: Optional[str] = None


class TokenResponse(BaseModel):
    # Compatibility with the existing React frontend.
    # The current UI stores `result.token` in localStorage as `authToken`.
    token: str
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)
