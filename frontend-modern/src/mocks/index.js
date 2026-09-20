// Mock data shaped like backend models for visual development only.
// All data is synthetic and for design showcase purposes.

export const mockUsers = [
    { id: 'u-admin-01', username: 'admin', name: 'System Admin', role: 'ADMIN', facility: 'Central Office', active: true },
    { id: 'u-doc-01', username: 'doctor1', name: 'Dr. Priya Iyer', role: 'DOCTOR', specialty: 'General Medicine', facility: 'District Hospital', active: true },
    { id: 'u-asha-01', username: 'asha1', name: 'Sunita Patil', role: 'PCW', facility: 'PHC Pune Rural', active: true },
    { id: 'u-pat-01', username: 'patient1', name: 'Ramesh Gaikwad', role: 'PATIENT', phone: '9876543210', active: true },
];

export const mockHospitals = [
    { id: 'h-01', name: 'District Civil Hospital', type: 'government', city: 'Pune', state: 'Maharashtra', has_icu: true, has_maternity: true, has_ambulance: true, capacity: 500 },
    { id: 'h-02', name: 'Sanjeevani Clinic', type: 'private', city: 'Baramati', state: 'Maharashtra', has_icu: false, has_maternity: true, has_ambulance: true, capacity: 50 },
];

export const mockPatients = [
    { id: 'p-01', name: 'Ramesh Gaikwad', age: 58, gender: 'male', village: 'Wagholi', district: 'Pune', health_id: 'HID-0002', risk_level: 'Yellow', is_pregnant: false, phone: '9123456781', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-01', blood_pressure: '138/88', condition: 'Persistent cough, mild fever' },
    { id: 'p-02', name: 'Sunitha Patil', age: 26, gender: 'female', village: 'Alandi', district: 'Pune', health_id: 'HID-0001', risk_level: 'Red', is_pregnant: true, phone: '9123456780', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-01', blood_pressure: '148/96', weeks: 28, condition: 'Elevated blood pressure' },
    { id: 'p-03', name: 'Meena Thorat', age: 32, gender: 'female', village: 'Hadapsar', district: 'Pune', health_id: 'HID-0003', risk_level: 'Green', is_pregnant: true, phone: '9123456782', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-01', blood_pressure: '118/72', weeks: 22, condition: 'Routine checkup' },
    { id: 'p-04', name: 'Balaji Shinde', age: 71, gender: 'male', village: 'Baramati', district: 'Pune', health_id: 'HID-0004', risk_level: 'Red', is_pregnant: false, phone: '9123456783', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-01', blood_pressure: '162/104', condition: 'Chest pain, breathlessness' },
];

export const mockVisits = [
    { id: 'v-01', patient_id: 'p-01', patient_name: 'Ramesh Gaikwad', asha_worker_id: 'u-asha-01', created_at: '2026-09-17T14:15:00', vitals: { blood_pressure_systolic: 138, blood_pressure_diastolic: 88, heart_rate: 76, temperature: 99.8, spo2: 95, respiratory_rate: 22 }, risk_level: 'Yellow', notes: 'Persistent cough for 10 days. Mild fever. Advised chest X-ray.' },
    { id: 'v-02', patient_id: 'p-02', patient_name: 'Sunitha Patil', asha_worker_id: 'u-asha-01', created_at: '2026-09-18T10:30:00', vitals: { blood_pressure_systolic: 148, blood_pressure_diastolic: 96, heart_rate: 88, temperature: 98.2, spo2: 97, respiratory_rate: 18 }, risk_level: 'Red', notes: 'BP elevated. Patient reports headache. Referred to hospital.' },
];

export const mockAlerts = [
    { id: 'a-01', patient_id: 'p-02', patient_name: 'Sunitha Patil', status: 'open', risk_level: 'Red', message: 'High blood pressure during pregnancy — pre-eclampsia risk', created_at: '2026-09-18T10:35:00', triggered_by: 'Sunita Patil' },
    { id: 'a-02', patient_id: 'p-01', patient_name: 'Ramesh Gaikwad', status: 'resolved', risk_level: 'Yellow', message: 'Persistent fever exceeding 10 days, unresolved cough', created_at: '2026-09-12T09:00:00', triggered_by: 'Sunita Patil', resolved_by: 'Dr. Priya Iyer' },
];

export const mockPrescriptions = [
    { id: 'rx-01', patient_id: 'p-01', patient_name: 'Ramesh Gaikwad', doctor_id: 'u-doc-01', doctor_name: 'Dr. Priya Iyer', medications: ['Amoxicillin 500mg', 'Paracetamol 650mg'], instructions: 'Amoxicillin TDS for 5 days. Paracetamol SOS for fever.', created_at: '2026-09-13T11:30:00' },
];

export const mockAppointments = [
    { id: 'apt-01', patient_id: 'p-02', patient_name: 'Sunitha Patil', doctor_id: 'u-doc-01', doctor_name: 'Dr. Priya Iyer', scheduled_at: '2026-09-20T10:00:00', status: 'scheduled', type: 'ANC Follow-up' },
];

export const mockNotifications = [
    { id: 'n-01', title: 'Emergency Alert', body: 'Sunitha Patil — high BP during pregnancy', type: 'ALERT', is_read: false, created_at: '2026-09-18T10:35:00' },
];

export const mockDashboardStats = {
    totalPatients: 40,
    highRisk: 6,
    mediumRisk: 10,
    lowRisk: 24,
    pendingAlerts: 3,
    completedVisitsToday: 8,
    upcomingAppointments: 5,
    pregnantWomen: 5,
    villagesCovered: 6,
};

export const mockSymptoms = [
    { id: 's-01', name: 'Fever', category: 'general', body_region: 'general' },
];

export const mockAIPrediction = {
    risk_level: 'Yellow',
    risk_score: 0.62,
    probable_condition: 'Upper respiratory tract infection',
    recommendations: 'Monitor temperature; Increase fluid intake; Rest for 48 hours; Follow up if symptoms persist beyond 5 days',
    model_type: 'symptom-triage-v1',
};

export const mockTimeline = [
    { date: '18 Sep', event: 'Home visit by Sunita Patil', type: 'visit', detail: 'BP 148/96 — referred to hospital' },
    { date: '15 Sep', event: 'ANC checkup at PHC', type: 'appointment', detail: 'Weight gain normal, urine protein negative' },
    { date: '10 Sep', event: 'Routine follow-up', type: 'visit', detail: 'BP 132/84 — advised salt reduction' },
    { date: '03 Sep', event: 'First registration', type: 'registration', detail: 'Registered by ASHA Worker' },
];
