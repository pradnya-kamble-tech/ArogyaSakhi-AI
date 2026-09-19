# Healthcare DSS - Quick Reference Guide

## 🚀 Quick Start

### First Time Setup
```bash
npm install
node backend/run-all-tests.js
node backend/server.js
```

### Daily Development
```bash
# Run all tests
node backend/run-all-tests.js

# Start server
node backend/server.js

# Or use Windows shortcuts
start.bat              # Full setup
start_no_install.bat   # Quick start
```

---

## 🧪 Testing Commands

### Run All Tests (Recommended)
```bash
node backend/run-all-tests.js
```

### Individual Test Suites
```bash
# Risk Engine
node backend/test-weighted-scoring.js

# Maternal Risk Engine  
node backend/test-maternal-scoring.js

# Escalation Engine
node backend/test-escalation-simple.js

# Summary Engine
node backend/test-summary.js

# Confidence Engine
node backend/verify-confidence.js

# Full Integration
node backend/verify-refactor.js
```

---

## 📂 Project Structure

```
healthcare-dss/
├── backend/
│   ├── services/              # Core AI engines
│   │   ├── riskEngine.js
│   │   ├── maternalRiskEngine.js
│   │   ├── escalationEngine.js
│   │   ├── summaryEngine.js
│   │   └── confidenceEngine.js
│   ├── server.js              # Main API server
│   ├── auth.js                # Authentication
│   ├── dataStore.js           # JSON persistence
│   ├── analytics.js           # Reporting
│   ├── patients.js            # Patient management
│   └── run-all-tests.js       # Master test runner
├── frontend/                  # Web UI
└── start.bat                  # Windows launcher
```

---

## 🔄 Development Workflow

### 1. Make Changes
- Edit service files in `backend/services/`
- Save changes

### 2. Test Changes
```bash
# Quick test (specific service)
node backend/test-[service-name].js

# Full test (all services)
node backend/run-all-tests.js
```

### 3. Deploy Changes
```bash
# Stop server (Ctrl+C)
# Restart server
node backend/server.js
```

### 4. Verify
- Open http://localhost:5000/index.html
- Test functionality
- Check console for errors

---

## 🎯 Common Tasks

### Add New Risk Factor
1. Edit `backend/services/riskEngine.js`
2. Update scoring logic
3. Run `node backend/test-weighted-scoring.js`
4. Restart server

### Modify Escalation Rules
1. Edit `backend/services/escalationEngine.js`
2. Update priority logic
3. Run `node backend/test-escalation-simple.js`
4. Restart server

### Adjust Confidence Scoring
1. Edit `backend/services/confidenceEngine.js`
2. Update scoring modifiers
3. Run `node backend/verify-confidence.js`
4. Restart server

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID [process_id] /F

# Restart
node backend/server.js
```

### Tests Failing
```bash
# Run individual test to see details
node backend/test-[name].js

# Check for syntax errors
# Review recent code changes
```

### Dependencies Missing
```bash
# Reinstall
npm install

# Or use
start.bat
```

---

## 📊 API Endpoints

### POST /analyze
Analyze patient case and return AI assessment

**Request:**
```json
{
  "age": 65,
  "symptoms": ["chest pain", "sweating"],
  "severity": "High",
  "vitals": {
    "bp": "160/100",
    "heart_rate": 110,
    "temperature": 99.5
  }
}
```

**Response:**
```json
{
  "ai": {
    "risk": "Red",
    "confidence": 85,
    "urgency": "Critical",
    "generalRiskDetails": {...},
    "maternalRiskDetails": {...},
    "escalationDetails": {...},
    "confidenceDetails": {...},
    "clinicalSummary": {...}
  },
  "status": "ESCALATED"
}
```

### GET /cases
List all cases

### GET /cases/:id
Get specific case

### POST /cases/:id/review
Submit doctor review

---

## ✅ Pre-Commit Checklist

- [ ] All tests pass (`node backend/run-all-tests.js`)
- [ ] Server starts without errors
- [ ] API returns expected responses
- [ ] No console errors in browser
- [ ] Code follows existing patterns
- [ ] Comments added for complex logic

---

## 📞 Support

For issues or questions:
1. Check SYSTEM_ANALYSIS.md for detailed documentation
2. Review test output for specific errors
3. Check server console for error messages
4. Verify all dependencies are installed

---

**Last Updated:** 2026-02-17
**Version:** 2.0 (Enhanced Edition)
