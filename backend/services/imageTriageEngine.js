/**
 * imageTriageEngine.js
 * ─────────────────────────────────────────────────────────
 * Standalone image triage evaluation service.
 *
 * Contract:
 *   evaluateImageTriage(caseData) → ImageTriageResult
 *
 * ImageTriageResult: {
 *   imageReviewed      : boolean,
 *   recommendation     : string | null,
 *   escalationModifier : number          // added to risk score downstream
 * }
 *
 * Rules:
 *  - Does NOT access the filesystem or store any image data.
 *  - Does NOT modify any other engine.
 *  - Does NOT touch escalation logic.
 *  - Safe to call regardless of whether an attachment was provided.
 * ─────────────────────────────────────────────────────────
 */

'use strict';

// Symptoms that warrant a visual inspection recommendation
const VISUAL_INSPECTION_SYMPTOMS = ['wound', 'infection'];

// Risk score threshold above which the escalation modifier is applied
const HIGH_RISK_THRESHOLD = 70;

/**
 * Evaluate image triage based on case data.
 *
 * @param {Object}   caseData                          - Incoming case payload
 * @param {Array}    [caseData.attachments]            - Array of attachment metadata objects
 * @param {Array}    [caseData.symptoms]               - Array of symptom strings
 * @param {number}   [caseData.baseRiskScore]          - Numeric risk score (0–100)
 * @param {Object}   [caseData.visualFindings]         - Client-side neural scan findings
 *
 * @returns {{ imageReviewed: boolean, recommendation: string|null, escalationModifier: number, neuralAnalysis: Object }}
 */
function evaluateImageTriage(caseData = {}) {
    const attachments = Array.isArray(caseData.attachments) ? caseData.attachments : [];
    const symptoms = Array.isArray(caseData.symptoms) ? caseData.symptoms : [];
    const baseRiskScore = typeof caseData.baseRiskScore === 'number' ? caseData.baseRiskScore : 0;
    const vf = caseData.visualFindings || {};

    // ── Default (no attachment) ──────────────────────────────────────
    if (attachments.length === 0) {
        return {
            imageReviewed: false,
            recommendation: null,
            escalationModifier: 0,
            neuralAnalysis: null
        };
    }

    // ── Attachment present ───────────────────────────────────────────
    let recommendation = null;
    let escalationModifier = 0;
    let detected = false;
    let markers = [];

    // Rule 1 – check neural scan findings (The 1% logic)
    if (vf.inflammation_detected) {
        detected = true;
        escalationModifier += 15; // High confidence visual marker
        recommendation = '⚠️ ALERT: Visual analysis detected acute inflammation. Urgent specialist review recommended.';
        markers.push('Acute Hyperemia', 'Tissue Distension');
    }

    if (vf.spectral_shift_detected && !detected) {
        detected = true;
        escalationModifier += 8;
        recommendation = 'Spectral irregularities detected in visual scan.';
        markers.push('Spectral Anomaly');
    }

    // Fallback Rule – visual inspection trigger based on text symptoms
    const symptomsLower = symptoms.map(s => String(s).toLowerCase());
    const needsVisualInspection = VISUAL_INSPECTION_SYMPTOMS.some(
        keyword => symptomsLower.some(s => s.includes(keyword))
    );
    if (!recommendation && needsVisualInspection) {
        recommendation = 'Visual inspection recommended by doctor (symptom match).';
    }

    // Rule 2 – high-risk escalation modifier (Legacy)
    if (baseRiskScore > HIGH_RISK_THRESHOLD && !detected) {
        escalationModifier = 5;
    }

    return {
        imageReviewed: true,
        recommendation,
        escalationModifier,
        neuralAnalysis: {
            detected,
            confidence: vf.confidence || 0,
            markers: markers,
            timestamp: vf.timestamp || new Date().toISOString()
        }
    };
}

module.exports = { evaluateImageTriage };
