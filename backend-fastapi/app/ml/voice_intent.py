"""Multilingual voice intent classification (Hindi, English, Marathi keywords)."""

INTENTS = {
    "emergency": {
        "en": ["emergency", "sos", "help", "urgent", "ambulance"],
        "hi": ["आपातकाल", "मदद", "एम्बुलेंस", "तुरंत"],
        "mr": ["आणीबाण", "मदत", "ॲम्ब्युलन्स"],
    },
    "search_patient": {
        "en": ["find patient", "search patient", "patient name"],
        "hi": ["मरीज खोज", "मरीज का नाम"],
        "mr": ["रुग्ण शोध", "रुग्णाचे नाव"],
    },
    "symptom_entry": {
        "en": ["symptom", "fever", "cough", "pain", "headache"],
        "hi": ["लक्षण", "बुखार", "खांसी", "दर्द"],
        "mr": ["लक्षण", "ताप", "खोकला", "दुखणे"],
    },
    "hospital_finder": {
        "en": ["hospital", "nearby", "clinic"],
        "hi": ["अस्पताल", "नजदीक"],
        "mr": ["रुग्णालय", "जवळ"],
    },
}


def classify_intent(transcript: str, language: str = "en") -> dict:
    text = transcript.lower().strip()
    scores = {}
    for intent, langs in INTENTS.items():
        keywords = langs.get(language, []) + langs.get("en", [])
        score = sum(1 for kw in keywords if kw.lower() in text)
        if score:
            scores[intent] = score

    if not scores:
        return {"intent": "unknown", "confidence": 0.3, "action": "clarify"}

    best = max(scores, key=scores.get)
    conf = min(0.95, 0.5 + scores[best] * 0.15)
    actions = {
        "emergency": "trigger_sos",
        "search_patient": "open_patient_search",
        "symptom_entry": "open_symptom_checker",
        "hospital_finder": "open_hospital_finder",
    }
    return {"intent": best, "confidence": conf, "action": actions.get(best, "none")}
