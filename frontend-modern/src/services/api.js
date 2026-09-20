import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    const msg = err.response?.data?.detail || err.response?.data?.error || err.message;
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)));
  }
);

export async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  const token = data.token || data.access_token;
  localStorage.setItem('authToken', token);
  localStorage.setItem('refreshToken', data.refresh_token || '');
  localStorage.setItem('userRole', data.user?.role || '');
  localStorage.setItem('userName', data.user?.name || '');
  localStorage.setItem('userId', data.user?.id || '');
  return data;
}

function normalizeAnalytics(raw) {
  if (!raw || typeof raw !== 'object') return {
    totalPatients: 0,
    totalCases: 0,
    totalUsers: 0,
    pendingFollowUps: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    recentAlerts: [],
    recommendations: [],
    patientHealthScore: 50,
    nextAppointment: null,
  };
  return {
    totalPatients: Number(raw.totalPatients || 0),
    totalCases: Number(raw.totalCases || 0),
    totalUsers: Number(raw.totalUsers || 0),
    pendingFollowUps: Number(raw.pendingFollowUps || 0),
    highRiskCount: Number(raw.highRiskCount || 0),
    mediumRiskCount: Number(raw.mediumRiskCount || 0),
    lowRiskCount: Number(raw.lowRiskCount || 0),
    recentAlerts: Array.isArray(raw.recentAlerts) ? raw.recentAlerts : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    patientHealthScore: Number(raw.patientHealthScore ?? 50),
    nextAppointment: raw.nextAppointment || null,
  };
}

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  const token = data.token || data.access_token;
  localStorage.setItem('authToken', token);
  localStorage.setItem('refreshToken', data.refresh_token || '');
  localStorage.setItem('userRole', data.user?.role || '');
  localStorage.setItem('userName', data.user?.name || '');
  localStorage.setItem('userId', data.user?.id || '');
  return data;
}

export async function logout() {
  const refresh = localStorage.getItem('refreshToken');
  try {
    if (refresh) await api.post('/auth/logout', { refresh_token: refresh });
  } catch (_) { /* ignore */ }
  localStorage.clear();
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function fetchDashboard() {
  const { data } = await api.get('/api/analytics');
  return normalizeAnalytics(data);
}

export async function fetchPatients(query) {
  const params = query ? { search: query } : {};
  const { data } = await api.get('/api/patients', { params });
  // Ensure we always return an array to the UI
  return Array.isArray(data) ? data : [];
}

export async function createPatient(body) {
  const { data } = await api.post('/patients', body);
  return data;
}

export async function symptomCheck(body) {
  const { data } = await api.post('/ai/symptom-checker', body);
  return data;
}

export async function skinDetect(file, patientId) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/ai/skin-disease-detect${patientId ? `?patient_id=${patientId}` : ''}`, form);
  return data;
}

export async function voiceIntent(transcript, language = 'en', patientId) {
  const { data } = await api.post('/ai/voice-intent', { transcript, language, patient_id: patientId });
  return data;
}

export async function triggerSOS(body) {
  const { data } = await api.post('/ai/sos', body);
  return data;
}

export async function chatWithPatient(body) {
  const { data } = await api.post('/ai/chat', body);
  return data;
}

export async function fetchPatientMe() {
  const { data } = await api.get('/patient/me');
  return data;
}

export async function alertAction(alertId, body) {
  const { data } = await api.post(`/api/alerts/${alertId}/action`, body);
  return data;
}

export async function fetchHospitalsNearby(lat, lng, emergency = false) {
  const { data } = await api.get('/hospitals/nearby', { params: { lat, lng, emergency } });
  return data;
}

export async function fetchAlerts() {
  const { data } = await api.get('/api/alerts');
  return data;
}

export async function fetchNotifications() {
  const { data } = await api.get('/api/notifications');
  return data;
}

export async function fetchAdminStats() {
  const { data } = await api.get('/admin/platform-stats');
  return data;
}

export async function fetchAdminUsers() {
  const { data } = await api.get('/admin/users');
  return data;
}

export async function syncBatch(items) {
  const { data } = await api.post('/sync/batch', items);
  return data;
}

export function wsAlertsUrl() {
  const token = localStorage.getItem('authToken');
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.hostname}:8001/ws/alerts?token=${encodeURIComponent(token)}`;
}

export default api;
