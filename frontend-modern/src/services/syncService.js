import { db } from '../db/db';
import { api } from './api';
import { decryptData } from '../utils/crypto';

// An in-memory cache of the unlocked PIN key (to avoid re-asking for PIN every time)
export let sessionCryptoKey = null;

export function setSessionKey(key) {
    sessionCryptoKey = key;
}

export async function syncNow() {
    if (!navigator.onLine) return;

    // Also check if we have the sessionCryptoKey available to decrypt
    if (!sessionCryptoKey) {
        console.warn("Sync aborted: Session key not unlocked");
        return;
    }

    const pending = await db.syncQueue.where('status').equals('pending').toArray();
    const casesToSync = [];

    for (const item of pending) {
        if (item.endpoint === '/sync/cases') {
            try {
                const encryptedCase = await db.cases.get(item.client_uuid);
                if (encryptedCase && encryptedCase.encrypted_payload) {
                    const payloadStr = await decryptData(
                        sessionCryptoKey,
                        encryptedCase.iv,
                        encryptedCase.encrypted_payload
                    );
                    casesToSync.push({
                        client_uuid: item.client_uuid,
                        ...payloadStr
                    });
                }
            } catch (err) {
                console.error("Failed to decrypt case", item.client_uuid, err);
            }
        }
    }

    if (casesToSync.length > 0) {
        try {
            // POST batch to endpoint
            await api.post('/sync/cases', casesToSync);

            // If success, mark as synced
            for (const item of pending) {
                await db.syncQueue.update(item.client_uuid, { status: 'synced' });
                await db.cases.update(item.client_uuid, { status: 'synced' });
            }

            // Pull doctor reviews (as per instructions)
            // For now just hitting a generic GET to fetch reviews, can be expanded later
            // await api.get('/cases'); 

        } catch (err) {
            console.error("Failed to sync batch", err);
        }
    }
}

window.addEventListener('online', syncNow);
