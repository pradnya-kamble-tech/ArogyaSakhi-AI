from app.models.patient import Patient
from app.models.ai_prediction import AIPrediction


def generate_patient_chat_response(patient: Patient | None, message: str, history: list[dict] | None, latest_prediction: dict | None) -> str:
    prompt = message.lower().strip()
    patient_name = patient.name if patient else 'the patient'
    medical_history = (patient.chronic_conditions or '').lower() if patient else ''
    risk_summary = ''
    if latest_prediction:
        risk_summary = f" Current assessment indicates {latest_prediction.get('probable_condition', 'a concern')} with {latest_prediction.get('risk_level', 'unknown')} risk."

    if 'emergency' in prompt or 'help' in prompt or 'sos' in prompt or 'urgent' in prompt:
        return f"{patient_name} needs immediate attention. Escalate to a doctor, keep the patient supine if needed, and arrange transport to the nearest facility.{risk_summary}"

    if 'fever' in prompt or 'cough' in prompt or 'breathlessness' in prompt:
        return f"Monitor {patient_name} for respiratory danger signs, keep fluids available, and seek a doctor if breathing worsens or fever rises above 39°C.{risk_summary}"

    if 'pain' in prompt or 'headache' in prompt or 'dizziness' in prompt:
        return f"Check vital signs regularly, watch for worsening headache, vomiting, or confusion, and refer if symptoms persist beyond 24 hours.{risk_summary}"

    if 'pregnancy' in prompt or 'pregnant' in prompt or 'fetal' in prompt or 'bleeding' in prompt:
        return f"Any bleeding, reduced fetal movements, or high blood pressure in pregnancy is serious. Arrange urgent referral and document results carefully.{risk_summary}"

    if 'dehydration' in prompt or 'thirst' in prompt or 'urine' in prompt:
        return f"Encourage small sips of clean fluids, monitor urine output, and escalate if vomiting continues or consciousness drops.{risk_summary}"

    bolus = ''
    if medical_history:
        bolus = f" Known history: {medical_history}."

    if latest_prediction:
        decisions = latest_prediction.get('recommendations', [])
        if decisions:
            return f"Review the current AI guidance: {'; '.join(decisions[:2])}. {bolus} Use patient context to recommend follow-up and escalate if risk is {latest_prediction.get('risk_level')}."

    return f"Ask for more details on symptoms, duration, and any danger signs. Use the patient's context to provide tailored advice.{risk_summary}"
