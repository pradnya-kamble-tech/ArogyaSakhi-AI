import Dexie from 'dexie';

export const db = new Dexie('ArogyaSakhiDB');

db.version(1).stores({
    patients: 'id, name, health_id, village',
    cases: 'client_uuid, patient_id, status', // Case payload encrypted
    syncQueue: 'client_uuid, endpoint, status' // pending, syncing
});
