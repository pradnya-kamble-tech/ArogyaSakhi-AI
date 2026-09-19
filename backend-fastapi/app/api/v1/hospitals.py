from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.hospital_finder import find_nearby_hospitals

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


@router.get("/nearby")
def nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(50),
    emergency: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return find_nearby_hospitals(db, lat, lng, radius_km, emergency)
