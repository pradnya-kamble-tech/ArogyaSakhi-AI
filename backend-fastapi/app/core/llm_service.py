"""
LLM Service — provider-agnostic AI completion layer.

Supported providers (set AI_PROVIDER env var):
  openai    — uses /v1/chat/completions (default)
  anthropic — uses /v1/messages
  google    — uses generativelanguage.googleapis.com

API key: AI_API_KEY (or OPENAI_API_KEY for backward compat)
Model:   AI_MODEL  (leave blank to use provider default)

The LLM is called ONLY from this module. Frontend never receives raw keys.
"""
import json
import httpx
from app.core.config import get_settings

_ERR_NO_KEY = {
    "error": True,
    "message": (
        "AI generation unavailable: set AI_API_KEY (and optionally AI_PROVIDER / AI_MODEL) "
        "in the backend .env file."
    ),
}


def _settings():
    return get_settings()


# ─────────────────────────────────────────────────────────────────────────────
# Internal dispatch
# ─────────────────────────────────────────────────────────────────────────────

async def _call_openai(api_key: str, model: str, system: str, user: str) -> dict:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.0,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        return json.loads(content)


async def _call_anthropic(api_key: str, model: str, system: str, user: str) -> dict:
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": 1024,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
        )
        r.raise_for_status()
        raw = r.json()["content"][0]["text"]
        # Anthropic doesn't enforce JSON mode — try to extract a JSON block
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        return json.loads(raw)


async def _call_google(api_key: str, model: str, system: str, user: str) -> dict:
    combined = f"{system}\n\n{user}"
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
        f":generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": combined}]}],
        "generationConfig": {"response_mime_type": "application/json"},
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        raw = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        return json.loads(raw)


async def generate_completion(system_prompt: str, user_prompt: str) -> dict:
    """Dispatch to the configured AI provider. Returns a dict."""
    s = _settings()
    api_key = s.AI_API_KEY
    if not api_key:
        return _ERR_NO_KEY

    provider = s.AI_PROVIDER.lower()
    model = s.resolved_ai_model

    try:
        if provider == "anthropic":
            return await _call_anthropic(api_key, model, system_prompt, user_prompt)
        elif provider == "google":
            return await _call_google(api_key, model, system_prompt, user_prompt)
        else:  # default: openai
            return await _call_openai(api_key, model, system_prompt, user_prompt)
    except Exception as exc:
        return {"error": True, "message": f"AI generation failed: {exc}"}


# ─────────────────────────────────────────────────────────────────────────────
# Clinical functions
# ─────────────────────────────────────────────────────────────────────────────

async def explain_decision(case_data: dict) -> dict:
    """
    Structured clinical decision explanation.
    The deterministic risk data is passed in so the LLM cannot override it.
    """
    sys_prompt = (
        "You are a clinical decision support assistant. You receive an assessment case "
        "containing vitals, symptoms, and deterministic engine outputs (risk_level, reasons, ml). "
        "Write a structured explanation of why the deterministic system produced this result. "
        "DO NOT invent patient values. DO NOT override risk levels. "
        "Output strict JSON: "
        '{"summary": "string", '
        '"key_factors": [{"factor": "string", "finding": "string", "clinical_relevance": "string"}], '
        '"risk_explanation": "string", '
        '"uncertainties": ["string"]}'
    )
    return await generate_completion(sys_prompt, json.dumps(case_data))


async def clinical_summary(case_data: dict) -> dict:
    """
    Concise clinical summary for handover and documentation.
    """
    sys_prompt = (
        "You are a clinical documentation assistant for a rural health program. "
        "Summarize the following patient assessment into a brief clinical note. "
        "Include: main complaints, key vital abnormalities, risk stratification, and gaps in information. "
        "DO NOT invent values. DO NOT claim diagnostic certainty. "
        "Output JSON: "
        '{"summary": "string", '
        '"important_findings": ["string"], '
        '"missing_information": ["string"], '
        '"uncertainty_note": "string"}'
    )
    return await generate_completion(sys_prompt, json.dumps(case_data))


async def handover_note(case_data: dict) -> dict:
    """
    Structured specialist handover note.
    """
    sys_prompt = (
        "You are an AI assisting in medical handovers from community health workers to specialists. "
        "Generate a structured handover note from the following case data. "
        "Use only information actually present in the data. "
        "Output JSON: "
        '{"patient_summary": "string", '
        '"major_symptoms": ["string"], '
        '"symptom_duration": "string", '
        '"important_vitals": {"key": "value"}, '
        '"medical_history": "string", '
        '"medications": ["string"], '
        '"allergies": ["string"], '
        '"pregnancy_info": "string or null", '
        '"red_flags": ["string"], '
        '"ai_ml_findings": "string", '
        '"reason_for_escalation": "string", '
        '"recommended_urgency": "string"}'
    )
    return await generate_completion(sys_prompt, json.dumps(case_data))


async def extract_voice_symptoms(transcript: str) -> dict:
    """
    Extract structured clinical data from a voice transcript.
    Only extract what is explicitly stated.
    """
    sys_prompt = (
        "You are a clinical parsing engine for a rural health application. "
        "A health worker has dictated a patient description. "
        "Extract ONLY information explicitly stated — do not infer or guess. "
        "Output JSON: "
        '{"symptoms": ["string"], '
        '"duration": "string or null", '
        '"severity": "mild|moderate|severe|null", '
        '"confidence_score": 0}'
    )
    return await generate_completion(sys_prompt, transcript)


async def differential_support(case_data: dict) -> dict:
    """
    AI-assisted differential diagnosis support.
    NEVER claims certainty. Marks everything as decision-support only.
    """
    sys_prompt = (
        "You are a differential diagnosis support engine for community health workers. "
        "Identify POSSIBLE clinical conditions based on the symptoms and findings. "
        "NEVER claim diagnostic certainty. All output is decision-support only, not diagnosis. "
        "Output JSON: "
        '{"disclaimer": "Decision support only — not a diagnosis", '
        '"possible_conditions": ['
        '{"condition": "string", '
        '"supporting_findings": ["string"], '
        '"missing_or_contradictory_findings": ["string"], '
        '"uncertainty": "string", '
        '"suggested_verification": "string"}'
        "]}"
    )
    return await generate_completion(sys_prompt, json.dumps(case_data))
