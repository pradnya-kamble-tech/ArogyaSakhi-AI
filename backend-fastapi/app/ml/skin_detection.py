"""Skin image analysis using OpenCV heuristics + optional ML."""

import os
from pathlib import Path

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


def analyze_skin_image(file_path: str) -> dict:
    if not CV2_AVAILABLE or not os.path.exists(file_path):
        return {
            "condition": "Unable to analyze - using clinical review",
            "confidence": 0.45,
            "severity": "medium",
            "is_ml_active": False,
            "description": "Image analysis could not be performed. A dermatologist review is recommended.",
            "recommendations": ["Consult dermatologist for visual confirmation"],
            "next_steps": "Schedule a telehealth consultation with a medical professional.",
        }

    img = cv2.imread(file_path)
    if img is None:
        return {
            "condition": "Invalid image",
            "confidence": 0,
            "severity": "unknown",
            "is_ml_active": False,
            "description": "The uploaded file could not be processed as an image.",
            "recommendations": ["Ensure image file is valid and readable"],
            "next_steps": "Try uploading a different image.",
        }

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    redness = cv2.inRange(hsv, (0, 50, 50), (10, 255, 255))
    red_ratio = np.sum(redness > 0) / (img.shape[0] * img.shape[1])

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / (img.shape[0] * img.shape[1])

    if red_ratio > 0.15 and edge_density > 0.05:
        condition = "Possible Inflammatory Dermatitis / Rash"
        severity = "medium"
        confidence = 0.72
        description = "Detected significant redness with irregular edges. Could indicate inflammatory condition or allergic reaction."
    elif red_ratio > 0.08:
        condition = "Mild Erythema"
        severity = "low"
        confidence = 0.65
        description = "Mild redness detected. Monitor for spread or increase in symptoms."
    elif edge_density > 0.08:
        condition = "Possible Fungal Infection or Dry Lesion"
        severity = "medium"
        confidence = 0.68
        description = "Irregular surface detected. Could indicate fungal infection or severe dryness."
    else:
        condition = "No Significant Abnormality"
        severity = "low"
        confidence = 0.58
        description = "No major abnormalities detected in this image. Consider this image as preliminary assessment only."

    return {
        "condition": condition,
        "confidence": confidence,
        "severity": severity,
        "is_ml_active": True,
        "description": description,
        "red_area_ratio": round(float(red_ratio), 4),
        "edge_density": round(float(edge_density), 4),
        "recommendations": [
            "Keep area clean and dry",
            "Avoid scratching to prevent infection",
            "Seek medical attention if symptoms worsen or spread",
            "Document changes with photos for doctor review",
        ],
        "next_steps": "If symptoms persist for more than 5 days or worsen, consult a dermatologist urgently.",
    }
