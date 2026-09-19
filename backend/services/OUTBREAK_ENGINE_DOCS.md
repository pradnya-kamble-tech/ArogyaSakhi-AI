# Outbreak Detection Engine - Documentation

## Overview
The `outbreakEngine.js` module analyzes stored cases to detect potential disease outbreaks based on symptom frequency patterns.

---

## Functions

### 1. `analyzeOutbreak(cases)`
Main function that analyzes cases for outbreak patterns.

**Parameters:**
- `cases` (Array): Array of case objects from the database

**Returns:**
```javascript
{
  outbreakDetected: true/false,
  alerts: [
    {
      symptom: "fever",
      count: 7,
      date: "2026-02-17",
      severity: "Moderate"
    }
  ]
}
```

**Severity Levels:**
- **Moderate**: 5-9 cases of same symptom on same day
- **High**: 10-19 cases
- **Critical**: 20+ cases

**Example:**
```javascript
const outbreakEngine = require('./services/outbreakEngine');
const cases = await getCasesFromDatabase();
const result = outbreakEngine.analyzeOutbreak(cases);

if (result.outbreakDetected) {
  console.log('⚠️ Outbreak detected!');
  result.alerts.forEach(alert => {
    console.log(`${alert.symptom}: ${alert.count} cases on ${alert.date} (${alert.severity})`);
  });
}
```

---

### 2. `getOutbreakSummary(outbreakResult)`
Generates summary statistics from outbreak analysis.

**Parameters:**
- `outbreakResult` (Object): Result from `analyzeOutbreak()`

**Returns:**
```javascript
{
  totalAlerts: 3,
  criticalAlerts: 1,
  highAlerts: 1,
  moderateAlerts: 1,
  affectedDates: 2,
  topSymptoms: [
    { symptom: 'fever', count: 45 },
    { symptom: 'cough', count: 23 }
  ]
}
```

**Example:**
```javascript
const result = outbreakEngine.analyzeOutbreak(cases);
const summary = outbreakEngine.getOutbreakSummary(result);

console.log(`Total alerts: ${summary.totalAlerts}`);
console.log(`Critical: ${summary.criticalAlerts}`);
console.log(`Top symptom: ${summary.topSymptoms[0].symptom}`);
```

---

### 3. `getOutbreakTrend(cases, days)`
Analyzes outbreak trends over time.

**Parameters:**
- `cases` (Array): Array of case objects
- `days` (Number): Number of days to analyze (default: 7)

**Returns:**
```javascript
{
  period: 7,
  dailyCounts: [
    { date: '2026-02-11', count: 3 },
    { date: '2026-02-12', count: 5 },
    { date: '2026-02-13', count: 8 }
  ],
  trending: 'increasing' // or 'decreasing' or 'stable'
}
```

**Example:**
```javascript
const trend = outbreakEngine.getOutbreakTrend(cases, 7);

if (trend.trending === 'increasing') {
  console.log('⚠️ Cases are increasing!');
}
```

---

## Integration Example

### Adding to Server API

```javascript
// In backend/server.js
const outbreakEngine = require('./services/outbreakEngine');

// New endpoint: GET /outbreak-status
app.get('/outbreak-status', (req, res) => {
  const cases = loadCases();
  const outbreak = outbreakEngine.analyzeOutbreak(cases);
  const summary = outbreakEngine.getOutbreakSummary(outbreak);
  const trend = outbreakEngine.getOutbreakTrend(cases, 7);
  
  res.json({
    outbreak,
    summary,
    trend
  });
});
```

### Frontend Display

```javascript
// Fetch outbreak status
const response = await fetch('/outbreak-status');
const data = await response.json();

if (data.outbreak.outbreakDetected) {
  // Show alert banner
  showOutbreakAlert(data.outbreak.alerts);
  
  // Display summary
  displayOutbreakSummary(data.summary);
  
  // Show trend chart
  displayTrendChart(data.trend);
}
```

---

## Use Cases

### 1. Daily Monitoring Dashboard
```javascript
// Check for outbreaks every day
setInterval(() => {
  const cases = loadCases();
  const outbreak = outbreakEngine.analyzeOutbreak(cases);
  
  if (outbreak.outbreakDetected) {
    sendAlertToHealthOfficials(outbreak.alerts);
  }
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

### 2. Real-Time Alerts
```javascript
// After each new case is added
app.post('/analyze', async (req, res) => {
  // ... existing analysis code ...
  
  // Check for outbreak
  const allCases = loadCases();
  const outbreak = outbreakEngine.analyzeOutbreak(allCases);
  
  if (outbreak.outbreakDetected) {
    // Add outbreak warning to response
    kase.outbreakWarning = outbreak.alerts;
  }
  
  res.json(kase);
});
```

### 3. Weekly Reports
```javascript
// Generate weekly outbreak report
function generateWeeklyReport() {
  const cases = loadCases();
  const outbreak = outbreakEngine.analyzeOutbreak(cases);
  const summary = outbreakEngine.getOutbreakSummary(outbreak);
  const trend = outbreakEngine.getOutbreakTrend(cases, 7);
  
  return {
    week: getCurrentWeek(),
    outbreakDetected: outbreak.outbreakDetected,
    totalAlerts: summary.totalAlerts,
    criticalSymptoms: summary.topSymptoms.slice(0, 3),
    trend: trend.trending,
    recommendations: generateRecommendations(outbreak)
  };
}
```

---

## Testing

Run the test suite:
```bash
node backend/test-outbreak.js
```

**Test Coverage:**
- ✅ No outbreak (low frequency)
- ✅ Moderate outbreak (5-9 cases)
- ✅ High outbreak (10-19 cases)
- ✅ Critical outbreak (20+ cases)
- ✅ Multiple dates
- ✅ Summary statistics
- ✅ Trend analysis
- ✅ Edge cases (empty, null, no symptoms)

---

## Algorithm Details

### Symptom Grouping
1. Extract date from case timestamp (YYYY-MM-DD)
2. Normalize symptom names (lowercase, trim)
3. Count occurrences per symptom per date

### Severity Classification
```javascript
if (count >= 20) severity = 'Critical';
else if (count >= 10) severity = 'High';
else if (count >= 5) severity = 'Moderate';
```

### Trend Detection
- Compares first half vs second half of period
- Increasing: second half > first half × 1.2
- Decreasing: second half < first half × 0.8
- Stable: otherwise

---

## Future Enhancements

Possible additions (not implemented yet):
- Geographic clustering (if location data available)
- Symptom combination patterns (e.g., fever + cough)
- Seasonal baseline comparison
- Predictive modeling
- Automatic notification system
- Integration with health authority APIs

---

## Module Structure

```
backend/services/outbreakEngine.js
├── analyzeOutbreak()       # Main detection function
├── getOutbreakSummary()    # Statistics generator
└── getOutbreakTrend()      # Trend analyzer

backend/test-outbreak.js    # Comprehensive test suite
```

---

**Created:** February 17, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
