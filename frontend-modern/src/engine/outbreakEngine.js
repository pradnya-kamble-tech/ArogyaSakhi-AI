// Outbreak Detection Engine
// Analyzes case patterns to detect potential disease outbreaks

/**
 * Analyzes cases to detect potential outbreaks based on symptom frequency
 * @param {Array} cases - Array of case objects from the database
 * @returns {Object} Outbreak analysis with alerts
 */
function analyzeOutbreak(cases) {
    // Initialize result
    const result = {
        outbreakDetected: false,
        alerts: []
    };

    // Validate input
    if (!Array.isArray(cases) || cases.length === 0) {
        return result;
    }

    // Group cases by date and count symptoms
    const symptomsByDate = {};

    cases.forEach(caseItem => {
        // Extract date (YYYY-MM-DD format)
        const timestamp = caseItem.timestamp || new Date().toISOString();
        const date = timestamp.split('T')[0]; // Get YYYY-MM-DD

        // Initialize date entry if not exists
        if (!symptomsByDate[date]) {
            symptomsByDate[date] = {};
        }

        // Count symptoms for this case
        const symptoms = caseItem.patient?.symptoms || [];
        symptoms.forEach(symptom => {
            const normalizedSymptom = symptom.toLowerCase().trim();
            if (!symptomsByDate[date][normalizedSymptom]) {
                symptomsByDate[date][normalizedSymptom] = 0;
            }
            symptomsByDate[date][normalizedSymptom]++;
        });
    });

    // Analyze each date for potential outbreaks
    Object.keys(symptomsByDate).forEach(date => {
        const symptomsOnDate = symptomsByDate[date];

        Object.keys(symptomsOnDate).forEach(symptom => {
            const count = symptomsOnDate[symptom];

            // Check if count exceeds outbreak threshold (5+ cases)
            if (count >= 5) {
                result.outbreakDetected = true;

                // Determine severity
                let severity = 'Moderate';
                if (count >= 20) {
                    severity = 'Critical';
                } else if (count >= 10) {
                    severity = 'High';
                }

                // Add alert
                result.alerts.push({
                    symptom: symptom,
                    count: count,
                    date: date,
                    severity: severity
                });
            }
        });
    });

    // Sort alerts by severity and count (most critical first)
    result.alerts.sort((a, b) => {
        const severityOrder = { 'Critical': 3, 'High': 2, 'Moderate': 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.count - a.count;
    });

    return result;
}

/**
 * Get outbreak summary statistics
 * @param {Object} outbreakResult - Result from analyzeOutbreak
 * @returns {Object} Summary statistics
 */
function getOutbreakSummary(outbreakResult) {
    if (!outbreakResult.outbreakDetected) {
        return {
            totalAlerts: 0,
            criticalAlerts: 0,
            highAlerts: 0,
            moderateAlerts: 0,
            affectedDates: 0,
            topSymptoms: []
        };
    }

    const summary = {
        totalAlerts: outbreakResult.alerts.length,
        criticalAlerts: outbreakResult.alerts.filter(a => a.severity === 'Critical').length,
        highAlerts: outbreakResult.alerts.filter(a => a.severity === 'High').length,
        moderateAlerts: outbreakResult.alerts.filter(a => a.severity === 'Moderate').length,
        affectedDates: new Set(outbreakResult.alerts.map(a => a.date)).size,
        topSymptoms: []
    };

    // Get top 5 symptoms by total count
    const symptomTotals = {};
    outbreakResult.alerts.forEach(alert => {
        if (!symptomTotals[alert.symptom]) {
            symptomTotals[alert.symptom] = 0;
        }
        symptomTotals[alert.symptom] += alert.count;
    });

    summary.topSymptoms = Object.entries(symptomTotals)
        .map(([symptom, count]) => ({ symptom, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return summary;
}

/**
 * Get outbreak trend analysis
 * @param {Array} cases - Array of case objects
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Object} Trend data
 */
function getOutbreakTrend(cases, days = 7) {
    const trend = {
        period: days,
        dailyCounts: [],
        trending: 'stable'
    };

    if (!Array.isArray(cases) || cases.length === 0) {
        return trend;
    }

    // Get date range
    const today = new Date();
    const dateMap = {};

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dateMap[dateStr] = 0;
    }

    // Count cases per day
    cases.forEach(caseItem => {
        const timestamp = caseItem.timestamp || new Date().toISOString();
        const date = timestamp.split('T')[0];
        if (dateMap.hasOwnProperty(date)) {
            dateMap[date]++;
        }
    });

    // Convert to array and sort by date
    trend.dailyCounts = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Determine trend (simple: compare first half vs second half)
    const midpoint = Math.floor(days / 2);
    const firstHalf = trend.dailyCounts.slice(0, midpoint);
    const secondHalf = trend.dailyCounts.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.2) {
        trend.trending = 'increasing';
    } else if (secondAvg < firstAvg * 0.8) {
        trend.trending = 'decreasing';
    }

    return trend;
}

export { analyzeOutbreak, getOutbreakSummary, getOutbreakTrend };
