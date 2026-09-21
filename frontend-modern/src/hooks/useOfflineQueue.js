/**
 * useOfflineQueue — manages upstream case sync AND downstream pull sync.
 *
 * Upstream: collects offline actions in localStorage, flushes on reconnect.
 * Downstream: after flush, pulls server-side case updates since last_sync_at
 *   and merges them into Dexie without destroying unsynced local records.
 *
 * Conflict rule: server wins on status/doctor fields only.
 *   Local unsynced payloads are never overwritten.
 */
import { useCallback, useEffect, useState } from 'react';
import { syncBatch } from '../services/api';
import api from '../services/api';
import { db } from '../db/db';

const QUEUE_KEY    = 'arogya_offline_queue';
const LAST_SYNC_KEY = 'arogya_last_downstream_sync';

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}
function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}
function getLastSync() {
  return localStorage.getItem(LAST_SYNC_KEY) || null;
}
function setLastSync(ts) {
  localStorage.setItem(LAST_SYNC_KEY, ts);
}

export function useOfflineQueue() {
  const [online, setOnline]   = useState(navigator.onLine);
  const [queue, setQueue]     = useState(loadQueue);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const enqueue = useCallback((action, payload) => {
    const item = {
      temp_id: `tmp_${Date.now()}`,
      action,
      payload,
      at: new Date().toISOString(),
    };
    setQueue((prev) => {
      const next = [...prev, item];
      saveQueue(next);
      return next;
    });
    return item.temp_id;
  }, []);

  // ── Downstream pull ────────────────────────────────────────────────────────
  const pullDownstream = useCallback(async () => {
    try {
      const since = getLastSync();
      const params = since ? { since } : {};
      const res = await api.get('/sync/downstream', { params });
      const { cases: serverCases = [], server_time } = res.data || {};

      for (const sc of serverCases) {
        const local = await db.cases.get(sc.client_uuid);
        if (local) {
          // Only merge server-side doctor/review fields — preserve local payload
          const localPayload = (() => {
            try { return JSON.parse(local.payload || '{}'); } catch { return {}; }
          })();
          const merged = {
            ...localPayload,
            // Server-authoritative fields
            status:           sc.status           || localPayload.status,
            risk_level:       sc.risk_level        || localPayload.risk_level,
            priority:         sc.priority          || localPayload.priority,
            doctor_notes:     sc.doctor_notes      ?? localPayload.doctor_notes,
            final_diagnosis:  sc.final_diagnosis   ?? localPayload.final_diagnosis,
            referral_facility:sc.referral_facility ?? localPayload.referral_facility,
            _server_updated_at: sc.updated_at,
          };
          // Only write if local record is not "pending" unsynced
          if (local.status !== 'pending') {
            await db.cases.put({
              ...local,
              status: sc.status || local.status,
              payload: JSON.stringify(merged),
            });
          }
        } else {
          // New case from server (another worker's case we're seeing for first time)
          await db.cases.put({
            client_uuid: sc.client_uuid,
            patient_id:  sc.patient_id  || null,
            status:      sc.status      || 'synced',
            payload:     JSON.stringify(sc),
          });
        }
      }

      if (server_time) setLastSync(server_time);
    } catch (err) {
      // Non-fatal — offline or permission denied
      console.warn('[useOfflineQueue] Downstream sync failed:', err.message);
    }
  }, []);

  // ── Full sync ──────────────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (!online) return;
    setSyncing(true);
    setSyncError('');
    try {
      // 1. Flush upload queue
      if (queue.length > 0) {
        await syncBatch(queue);
        setQueue([]);
        saveQueue([]);
      }
      // 2. Pull downstream updates
      await pullDownstream();
    } catch (err) {
      setSyncError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [online, queue, pullDownstream]);

  // Auto-sync on reconnect
  useEffect(() => {
    if (online && queue.length) syncNow();
  }, [online, queue.length, syncNow]);

  return { online, queue, syncing, syncError, enqueue, syncNow };
}
