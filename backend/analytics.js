// Analytics module for generating dashboard statistics

function getAnalytics(cases, patients) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Basic counts
  const totalCases = cases.length;
  const totalPatients = patients.length;

  // Status distribution
  const statusCounts = { AI_REVIEWED: 0, ESCALATED: 0, DOCTOR_REVIEWED: 0, CLOSED: 0 };
  const riskCounts = { Green: 0, Amber: 0, Red: 0 };
  const conditionCounts = {};
  const facilityCounts = {};

  // Time-based analysis
  const casesToday = [];
  const casesThisWeek = [];
  const casesThisMonth = [];

  // Processing time analysis
  let totalProcessingTime = 0;
  let processedCount = 0;

  for (const c of cases) {
    // Status counts
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    // Risk counts
    if (c.ai && c.ai.risk) {
      riskCounts[c.ai.risk] = (riskCounts[c.ai.risk] || 0) + 1;
    }

    // Condition counts
    if (c.ai && c.ai.conditionCode) {
      conditionCounts[c.ai.conditionCode] = (conditionCounts[c.ai.conditionCode] || 0) + 1;
    }

    // Facility counts
    if (c.facility) {
      facilityCounts[c.facility] = (facilityCounts[c.facility] || 0) + 1;
    }

    // Time-based filtering
    const caseDate = new Date(c.createdAt);
    if (caseDate >= today) casesToday.push(c);
    if (caseDate >= weekAgo) casesThisWeek.push(c);
    if (caseDate >= monthAgo) casesThisMonth.push(c);

    // Processing time (from creation to doctor review)
    if (c.doctorReview && c.doctorReview.reviewedAt) {
      const created = new Date(c.createdAt);
      const reviewed = new Date(c.doctorReview.reviewedAt);
      totalProcessingTime += (reviewed - created);
      processedCount++;
    }
  }

  // Average processing time in minutes
  const avgProcessingTime = processedCount > 0 
    ? Math.round(totalProcessingTime / processedCount / 60000) 
    : 0;

  // Escalation rate
  const escalationRate = totalCases > 0 
    ? Math.round((statusCounts.ESCALATED + statusCounts.DOCTOR_REVIEWED + statusCounts.CLOSED) / totalCases * 100) 
    : 0;

  // Symptom frequency analysis
  const symptomCounts = {};
  for (const c of cases) {
    for (const symptom of (c.symptoms || [])) {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    }
  }

  // Age distribution
  const ageGroups = { '0-5': 0, '6-12': 0, '13-18': 0, '19-40': 0, '41-60': 0, '60+': 0 };
  for (const c of cases) {
    const age = c.patient?.age;
    if (age !== undefined) {
      if (age <= 5) ageGroups['0-5']++;
      else if (age <= 12) ageGroups['6-12']++;
      else if (age <= 18) ageGroups['13-18']++;
      else if (age <= 40) ageGroups['19-40']++;
      else if (age <= 60) ageGroups['41-60']++;
      else ageGroups['60+']++;
    }
  }

  // Severity distribution
  const severityCounts = { Low: 0, Medium: 0, High: 0 };
  for (const c of cases) {
    if (c.severity) {
      severityCounts[c.severity] = (severityCounts[c.severity] || 0) + 1;
    }
  }

  // Cases by hour (for last 7 days)
  const hourlyDistribution = new Array(24).fill(0);
  for (const c of casesThisWeek) {
    const hour = new Date(c.createdAt).getHours();
    hourlyDistribution[hour]++;
  }

  // Cases by day of week (for last 30 days)
  const dailyDistribution = new Array(7).fill(0);
  for (const c of casesThisMonth) {
    const day = new Date(c.createdAt).getDay();
    dailyDistribution[day]++;
  }

  // Trend data (last 7 days)
  const trendData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = cases.filter(c => c.createdAt.startsWith(dateStr)).length;
    const redCount = cases.filter(c => c.createdAt.startsWith(dateStr) && c.ai?.risk === 'Red').length;
    const amberCount = cases.filter(c => c.createdAt.startsWith(dateStr) && c.ai?.risk === 'Amber').length;
    trendData.push({ date: dateStr, total: count, red: redCount, amber: amberCount });
  }

  // Top conditions
  const topConditions = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  // Top symptoms
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symptom, count]) => ({ symptom, count }));

  return {
    summary: {
      totalCases,
      totalPatients,
      casesToday: casesToday.length,
      casesThisWeek: casesThisWeek.length,
      casesThisMonth: casesThisMonth.length,
      avgProcessingTime,
      escalationRate
    },
    statusDistribution: statusCounts,
    riskDistribution: riskCounts,
    severityDistribution: severityCounts,
    ageDistribution: ageGroups,
    conditionDistribution: conditionCounts,
    topConditions,
    topSymptoms,
    hourlyDistribution,
    dailyDistribution,
    trendData,
    facilityDistribution: facilityCounts,
    generatedAt: new Date().toISOString()
  };
}

function getAuditLog(cases, options = {}) {
  const { startDate, endDate, actor, action, limit = 100 } = options;
  
  let allAudits = [];
  
  for (const c of cases) {
    for (const audit of (c.audit || [])) {
      allAudits.push({
        ...audit,
        caseId: c.id,
        patientAge: c.patient?.age,
        risk: c.ai?.risk
      });
    }
  }

  // Apply filters
  if (startDate) {
    allAudits = allAudits.filter(a => new Date(a.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    allAudits = allAudits.filter(a => new Date(a.timestamp) <= new Date(endDate));
  }
  if (actor) {
    allAudits = allAudits.filter(a => a.actor?.toLowerCase().includes(actor.toLowerCase()));
  }
  if (action) {
    allAudits = allAudits.filter(a => a.action?.toLowerCase().includes(action.toLowerCase()));
  }

  // Sort by timestamp descending
  allAudits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return allAudits.slice(0, limit);
}

function getCasesByFilter(cases, filters = {}) {
  let filtered = [...cases];
  
  const { status, risk, startDate, endDate, minAge, maxAge, severity, search } = filters;

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (risk) {
    filtered = filtered.filter(c => c.ai?.risk === risk);
  }
  if (startDate) {
    filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(startDate));
  }
  if (endDate) {
    filtered = filtered.filter(c => new Date(c.createdAt) <= new Date(endDate));
  }
  if (minAge !== undefined) {
    filtered = filtered.filter(c => c.patient?.age >= minAge);
  }
  if (maxAge !== undefined) {
    filtered = filtered.filter(c => c.patient?.age <= maxAge);
  }
  if (severity) {
    filtered = filtered.filter(c => c.severity === severity);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => 
      c.id.toLowerCase().includes(q) ||
      c.ai?.condition?.toLowerCase().includes(q) ||
      c.symptoms?.some(s => s.toLowerCase().includes(q))
    );
  }

  return filtered;
}

module.exports = { getAnalytics, getAuditLog, getCasesByFilter };
