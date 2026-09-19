import math
from sqlalchemy.orm import Session
from app.models.hospital import Hospital


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def find_nearby_hospitals(db: Session, lat: float, lng: float, radius_km: float = 50, emergency: bool = False):
    hospitals = db.query(Hospital).all()
    results = []
    for h in hospitals:
        if h.latitude is None or h.longitude is None:
            continue
        dist = haversine_km(lat, lng, h.latitude, h.longitude)
        if dist <= radius_km:
            results.append({
                "id": h.id,
                "name": h.name,
                "type": h.type,
                "address": h.address,
                "city": h.city,
                "phone": h.phone,
                "distance_km": round(dist, 2),
                "has_icu": h.has_icu,
                "has_maternity": h.has_maternity,
                "has_ambulance": h.has_ambulance,
                "recommend_ambulance": emergency and dist > 15,
            })
    results.sort(key=lambda x: x["distance_km"])
    return results
