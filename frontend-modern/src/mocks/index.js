// Mock data shaped like backend models for visual development only.
// All data is synthetic and for design showcase purposes.

export const mockUsers = [
    { id: 'u-admin-01', username: 'admin', name: 'System Admin', role: 'ADMIN', facility: 'Central Office', active: true },
    { id: 'u-doc-01', username: 'doctor1', name: 'Dr. Ananya Sharma', role: 'DOCTOR', specialty: 'General Medicine', facility: 'District Hospital', active: true },
    { id: 'u-doc-02', username: 'doctor2', name: 'Dr. Vikram Iyer', role: 'DOCTOR', specialty: 'Pediatrics', facility: 'Rural PHC', active: true },
    { id: 'u-doc-03', username: 'doctor3', name: 'Dr. Prerna Desai', role: 'DOCTOR', specialty: 'OB/GYN', facility: 'Apollo Clinic', active: true },
    { id: 'u-asha-01', username: 'pcw1', name: 'Priya Jadhav', role: 'PCW', facility: 'PHC Andheri', active: true },
    { id: 'u-asha-02', username: 'asha1', name: 'Sunita Kamble', role: 'PCW', facility: 'PHC Pune Rural', active: true },
    { id: 'u-asha-03', username: 'asha2', name: 'Kavita More', role: 'PCW', facility: 'PHC Baramati', active: true },
    { id: 'u-pat-01', username: 'patient1', name: 'Ramesh Kumar', role: 'PATIENT', phone: '9876543210', active: true },
];

export const mockHospitals = [
    { id: 'h-01', name: 'District Civil Hospital', type: 'government', city: 'Pune', state: 'Maharashtra', has_icu: true, has_maternity: true, has_ambulance: true, capacity: 500 },
    { id: 'h-02', name: 'Sanjeevani Clinic', type: 'private', city: 'Baramati', state: 'Maharashtra', has_icu: false, has_maternity: true, has_ambulance: true, capacity: 50 },
    { id: 'h-03', name: 'Rural Health Centre', type: 'phc', city: 'Shirur', state: 'Maharashtra', has_icu: false, has_maternity: false, has_ambulance: true, capacity: 30 },
    { id: 'h-04', name: 'Lifeline Hospital', type: 'private', city: 'Pune', state: 'Maharashtra', has_icu: true, has_maternity: true, has_ambulance: true, capacity: 200 },
    { id: 'h-05', name: 'City Care Centre', type: 'private', city: 'Khed', state: 'Maharashtra', has_icu: true, has_maternity: false, has_ambulance: false, capacity: 80 },
    { id: 'h-06', name: 'Navjeevan Trust Hospital', type: 'government', city: 'Bhor', state: 'Maharashtra', has_icu: false, has_maternity: true, has_ambulance: true, capacity: 120 },
];

export const mockPatients = [
    { id: 'p-01', name: 'Sunitha Patil', age: 26, gender: 'female', village: 'Alandi', district: 'Pune', health_id: 'HID-0001', risk_level: 'Red', is_pregnant: true, phone: '9123456780', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-03', blood_pressure: '148/96', weeks: 28, condition: 'Elevated blood pressure' },
    { id: 'p-02', name: 'Ramesh Gaikwad', age: 58, gender: 'male', village: 'Wagholi', district: 'Pune', health_id: 'HID-0002', risk_level: 'Yellow', is_pregnant: false, phone: '9123456781', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-01', blood_pressure: '138/88', condition: 'Persistent cough, mild fever' },
    { id: 'p-03', name: 'Meena Thorat', age: 32, gender: 'female', village: 'Hadapsar', district: 'Pune', health_id: 'HID-0003', risk_level: 'Green', is_pregnant: true, phone: '9123456782', asha_worker_id: 'u-asha-02', doctor_id: 'u-doc-03', blood_pressure: '118/72', weeks: 22, condition: 'Routine checkup' },
    { id: 'p-04', name: 'Balaji Shinde', age: 71, gender: 'male', village: 'Baramati', district: 'Pune', health_id: 'HID-0004', risk_level: 'Red', is_pregnant: false, phone: '9123456783', asha_worker_id: 'u-asha-03', doctor_id: 'u-doc-01', blood_pressure: '162/104', condition: 'Chest pain, breathlessness' },
    { id: 'p-05', name: 'Kavita Mane', age: 24, gender: 'female', village: 'Shirur', district: 'Pune', health_id: 'HID-0005', risk_level: 'Green', is_pregnant: false, phone: '9123456784', asha_worker_id: 'u-asha-02', doctor_id: 'u-doc-02', blood_pressure: '112/70', condition: 'Mild headache' },
    { id: 'p-06', name: 'Ganesh Jagtap', age: 45, gender: 'male', village: 'Khed', district: 'Pune', health_id: 'HID-0006', risk_level: 'Yellow', is_pregnant: false, phone: '9123456785', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-01', blood_pressure: '140/90', condition: 'Joint pain, fatigue' },
    { id: 'p-07', name: 'Lakshmi Bhosale', age: 34, gender: 'female', village: 'Bhor', district: 'Pune', health_id: 'HID-0007', risk_level: 'Green', is_pregnant: true, phone: '9123456786', asha_worker_id: 'u-asha-03', doctor_id: 'u-doc-03', blood_pressure: '116/74', weeks: 34, condition: 'Normal pregnancy progression' },
    { id: 'p-08', name: 'Deepak Waghmare', age: 12, gender: 'male', village: 'Alandi', district: 'Pune', health_id: 'HID-0008', risk_level: 'Yellow', is_pregnant: false, phone: '9123456787', asha_worker_id: 'u-asha-01', doctor_id: 'u-doc-02', blood_pressure: '100/60', condition: 'Recurring diarrhea' },
];

export const mockVisits = [
    { id: 'v-01', patient_id: 'p-01', patient_name: 'Sunitha Patil', asha_worker_id: 'u-asha-01', created_at: '2026-09-18T10:30:00', vitals: { blood_pressure_systolic: 148, blood_pressure_diastolic: 96, heart_rate: 88, temperature: 98.2, spo2: 97, respiratory_rate: 18 }, risk_level: 'Red', notes: 'BP elevated. Patient reports headache. Referred to hospital.' },
    { id: 'v-02', patient_id: 'p-02', patient_name: 'Ramesh Gaikwad', asha_worker_id: 'u-asha-01', created_at: '2026-09-17T14:15:00', vitals: { blood_pressure_systolic: 138, blood_pressure_diastolic: 88, heart_rate: 76, temperature: 99.8, spo2: 95, respiratory_rate: 22 }, risk_level: 'Yellow', notes: 'Persistent cough for 10 days. Mild fever. Advised chest X-ray.' },
    { id: 'v-03', patient_id: 'p-03', patient_name: 'Meena Thorat', asha_worker_id: 'u-asha-02', created_at: '2026-09-16T09:00:00', vitals: { blood_pressure_systolic: 118, blood_pressure_diastolic: 72, heart_rate: 80, temperature: 98.4, spo2: 98, respiratory_rate: 16 }, risk_level: 'Green', notes: 'Routine ANC visit. All vitals normal.' },
    { id: 'v-04', patient_id: 'p-04', patient_name: 'Balaji Shinde', asha_worker_id: 'u-asha-03', created_at: '2026-09-15T16:45:00', vitals: { blood_pressure_systolic: 162, blood_pressure_diastolic: 104, heart_rate: 96, temperature: 98.6, spo2: 92, respiratory_rate: 24 }, risk_level: 'Red', notes: 'Chest pain reported. SpO2 low. Immediate referral.' },
];

export const mockAlerts = [
    { id: 'a-01', patient_id: 'p-01', patient_name: 'Sunitha Patil', status: 'open', risk_level: 'Red', message: 'High blood pressure during pregnancy — pre-eclampsia risk', created_at: '2026-09-18T10:35:00', triggered_by: 'Priya Jadhav' },
    { id: 'a-02', patient_id: 'p-04', patient_name: 'Balaji Shinde', status: 'accepted', risk_level: 'Red', message: 'Chest pain with low SpO2 — possible cardiac event', created_at: '2026-09-15T16:50:00', triggered_by: 'Kavita More', resolved_by: 'Dr. Ananya Sharma' },
    { id: 'a-03', patient_id: 'p-02', patient_name: 'Ramesh Gaikwad', status: 'resolved', risk_level: 'Yellow', message: 'Persistent fever exceeding 10 days, unresolved cough', created_at: '2026-09-12T09:00:00', triggered_by: 'Priya Jadhav', resolved_by: 'Dr. Ananya Sharma' },
];

export const mockPrescriptions = [
    { id: 'rx-01', patient_id: 'p-04', patient_name: 'Balaji Shinde', doctor_id: 'u-doc-01', doctor_name: 'Dr. Ananya Sharma', medications: ['Aspirin 75mg', 'Atorvastatin 20mg', 'Amlodipine 5mg'], instructions: 'Take daily after breakfast. Follow up in 1 week.', created_at: '2026-09-15T18:00:00' },
    { id: 'rx-02', patient_id: 'p-02', patient_name: 'Ramesh Gaikwad', doctor_id: 'u-doc-01', doctor_name: 'Dr. Ananya Sharma', medications: ['Amoxicillin 500mg', 'Paracetamol 650mg'], instructions: 'Amoxicillin TDS for 5 days. Paracetamol SOS for fever.', created_at: '2026-09-13T11:30:00' },
];

export const mockAppointments = [
    { id: 'apt-01', patient_id: 'p-01', patient_name: 'Sunitha Patil', doctor_id: 'u-doc-03', doctor_name: 'Dr. Prerna Desai', scheduled_at: '2026-09-20T10:00:00', status: 'scheduled', type: 'ANC Follow-up' },
    { id: 'apt-02', patient_id: 'p-04', patient_name: 'Balaji Shinde', doctor_id: 'u-doc-01', doctor_name: 'Dr. Ananya Sharma', scheduled_at: '2026-09-22T14:30:00', status: 'scheduled', type: 'Cardiac Review' },
    { id: 'apt-03', patient_id: 'p-08', patient_name: 'Deepak Waghmare', doctor_id: 'u-doc-02', doctor_name: 'Dr. Vikram Iyer', scheduled_at: '2026-09-19T11:00:00', status: 'completed', type: 'Pediatric Checkup' },
];

export const mockNotifications = [
    { id: 'n-01', title: 'Emergency Alert', body: 'Sunitha Patil — high BP during pregnancy', type: 'ALERT', is_read: false, created_at: '2026-09-18T10:35:00' },
    { id: 'n-02', title: 'Visit Completed', body: 'Ramesh Gaikwad home visit documented', type: 'INFO', is_read: true, created_at: '2026-09-17T14:20:00' },
    { id: 'n-03', title: 'Appointment Reminder', body: 'Balaji Shinde cardiac review on Sep 22', type: 'REMINDER', is_read: false, created_at: '2026-09-16T08:00:00' },
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
    { id: 's-02', name: 'Cough', category: 'respiratory', body_region: 'chest' },
    { id: 's-03', name: 'Breathlessness', category: 'respiratory', body_region: 'chest' },
    { id: 's-04', name: 'Chest Pain', category: 'cardiac', body_region: 'chest' },
    { id: 's-05', name: 'Headache', category: 'neurological', body_region: 'head' },
    { id: 's-06', name: 'Rash', category: 'skin', body_region: 'skin' },
    { id: 's-07', name: 'Diarrhea', category: 'gi', body_region: 'abdomen' },
    { id: 's-08', name: 'Vomiting', category: 'gi', body_region: 'abdomen' },
    { id: 's-09', name: 'Abdominal Pain', category: 'gi', body_region: 'abdomen' },
    { id: 's-10', name: 'Fatigue', category: 'general', body_region: 'general' },
    { id: 's-11', name: 'Joint Pain', category: 'musculoskeletal', body_region: 'legs' },
    { id: 's-12', name: 'Nausea', category: 'gi', body_region: 'abdomen' },
    { id: 's-13', name: 'Dizziness', category: 'neurological', body_region: 'head' },
    { id: 's-14', name: 'Swelling', category: 'general', body_region: 'legs' },
    { id: 's-15', name: 'Palpitations', category: 'cardiac', body_region: 'chest' },
    { id: 's-16', name: 'High BP', category: 'cardiovascular', body_region: 'general' },
];

export const mockAIPrediction = {
    risk_level: 'Yellow',
    risk_score: 0.62,
    probable_condition: 'Upper respiratory tract infection',
    recommendations: 'Monitor temperature; Increase fluid intake; Rest for 48 hours; Follow up if symptoms persist beyond 5 days',
    model_type: 'symptom-triage-v1',
};

export const mockTimeline = [
    { date: '18 Sep', event: 'Home visit by Priya Jadhav', type: 'visit', detail: 'BP 148/96 — referred to hospital' },
    { date: '15 Sep', event: 'ANC checkup at PHC', type: 'appointment', detail: 'Weight gain normal, urine protein negative' },
    { date: '10 Sep', event: 'Routine follow-up', type: 'visit', detail: 'BP 132/84 — advised salt reduction' },
    { date: '03 Sep', event: 'First registration', type: 'registration', detail: 'Registered by ASHA Worker Priya' },
];
