"""Python risk engine mirroring Node logic for symptom analysis."""

CONDITIONS = {
    "respiratory_infection": {
        "triggers": [["fever", "cough"], ["fever", "cough", "breathlessness"], ["cough", "breathlessness"]],
        "urgency": "high",
        "label": "Respiratory Infection",
    },
    "acute_gastroenteritis": {
        "triggers": [["diarrhea", "vomiting"], ["diarrhea", "fever"], ["nausea", "vomiting"]],
        "urgency": "medium",
        "label": "Acute Gastroenteritis",
    },
    "cardiorespiratory_concern": {
        "triggers": [["chest_pain", "breathlessness"], ["chest_pain", "sweating"], ["palpitations", "chest_pain"]],
        "urgency": "critical",
        "label": "Cardiorespiratory Concern",
    },
    "possible_systemic_infection": {
        "triggers": [["fever", "confusion"], ["headache", "fever", "neck_stiffness"]],
        "urgency": "critical",
        "label": "Systemic Infection",
    },
    "infectious_exanthem": {
        "triggers": [["fever", "rash"], ["rash", "itching"]],
        "urgency": "medium",
        "label": "Infectious Exanthem",
    },
}


SYMPTOM_SYNONYMS = {
    "breathing issue": "breathlessness",
    "shortness of breath": "breathlessness",
    "difficulty breathing": "breathlessness",
    "chest pain": "chest_pain",
    "severe chest pain": "chest_pain",
    "abdominal pain": "severe_abdominal_pain",
    "head ache": "headache",
    "high fever": "fever",
    "coughing": "cough",
}

CRITICAL_SYMPTOMS = {"chest_pain", "breathlessness", "confusion", "severe_abdominal_pain", "neck_stiffness", "rash"}


def _normalize_symptoms(symptoms: list[str]) -> list[str]:
    normalized = []
    for symptom in symptoms:
        if not symptom:
            continue
        key = symptom.lower().strip()
        key = SYMPTOM_SYNONYMS.get(key, key)
        normalized.append(key.replace(" ", "_"))
    return normalized


def _match_condition(symptoms: list[str]) -> tuple[str, str, int]:
    sym_set = set(_normalize_symptoms(symptoms))
    best = ("general_assessment", "General Assessment", 15)
    best_score = 0
    for key, data in CONDITIONS.items():
        for trigger in data["triggers"]:
            if all(t in sym_set for t in trigger):
                score = len(trigger) * 25
                if score > best_score:
                    best_score = score
                    best = (key, data["label"], score)
    if best_score == 0:
        if sym_set & CRITICAL_SYMPTOMS:
            return ("potential_critical", "Potential Critical Condition", 45)
        if len(sym_set) >= 3:
            return ("multiple_symptoms", "Multiple Symptoms", 35)
    return best


def _vital_modifier(vitals: dict | None) -> int:
    if not vitals:
        return 0
    mod = 0
    temp = vitals.get("temperature") or vitals.get("temp")
    hr = vitals.get("heart_rate") or vitals.get("pulse")
    spo2 = vitals.get("spo2") or vitals.get("oxygen_saturation")
    if temp and float(temp) >= 39:
        mod += 15
    elif temp and float(temp) >= 38:
        mod += 8
    if hr and int(hr) > 120:
        mod += 10
    if spo2 and float(spo2) < 92:
        mod += 20
    bp_sys = vitals.get("bp_systolic") or vitals.get("systolic")
    if bp_sys and int(bp_sys) >= 180:
        mod += 15
    return mod


def evaluate_risk(payload: dict) -> dict:
    symptoms = payload.get("symptoms") or []
    age = int(payload.get("age") or 30)
    severity = (payload.get("severity") or "moderate").lower()
    vitals = payload.get("vitals") or {}
    is_pregnant = payload.get("is_pregnant", False)

    key, label, base = _match_condition(symptoms)
    normalized_symptoms = _normalize_symptoms(symptoms)
    score = base + _vital_modifier(vitals)
    score += min(20, len(set(normalized_symptoms)) * 5)

    severity_map = {"mild": 0, "moderate": 10, "severe": 25, "critical": 40}
    score += severity_map.get(severity, 10)

    if age >= 65:
        score += 10
    if age <= 5:
        score += 12
    if is_pregnant:
        preg_symptoms = {"bleeding", "severe_abdominal_pain", "reduced_fetal_movement", "severe_headache", "swelling"}
        sym_set = set(normalized_symptoms)
        if sym_set & preg_symptoms:
            score += 25

    score = min(100, max(0, score))
    if score >= 70:
        risk_level = "Red"
        emergency_level = "critical"
    elif score >= 35:
        risk_level = "Yellow"
        emergency_level = "moderate"
    else:
        risk_level = "Green"
        emergency_level = "low"

    recommendations = []
    if risk_level == "Red":
        recommendations = [
            "Immediate medical attention required",
            "Contact nearest emergency hospital",
            "Notify assigned doctor immediately",
            "Consider ambulance dispatch",
        ]
    elif risk_level == "Yellow":
        recommendations = [
            "Schedule doctor consultation within 24 hours",
            "Monitor vitals every 4 hours",
            "Maintain hydration and rest",
        ]
    else:
        recommendations = [
            "Continue home care with monitoring",
            "Follow ASHA worker guidance",
            "Return if symptoms worsen",
        ]

    return {
        "probable_condition": label,
        "condition_code": key,
        "risk_percentage": score,
        "risk_level": risk_level,
        "emergency_level": emergency_level,
        "confidence": round(min(95, 60 + len(symptoms) * 5), 1),
        "recommendations": recommendations,
        "dehydration_risk": "high" if "diarrhea" in [s.lower() for s in symptoms] and score > 40 else "low",
        "infection_risk": "high" if score > 55 else "moderate" if score > 30 else "low",
        "pregnancy_complication_risk": "high" if is_pregnant and score > 50 else "low",
        "emergency_probability": score / 100,
    }
