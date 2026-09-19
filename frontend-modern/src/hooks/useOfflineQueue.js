import { useCallback, useEffect, useState } from 'react';
import { syncBatch } from '../services/api';

const KEY = 'arogya_offline_queue';

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(q) {
  localStorage.setItem(KEY, JSON.stringify(q));
}

export function useOfflineQueue() {
  const [online, setOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(loadQueue);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const enqueue = useCallback((action, payload) => {
    const item = { temp_id: `tmp_${Date.now()}`, action, payload, at: new Date().toISOString() };
    setQueue((prev) => {
      const next = [...prev, item];
      saveQueue(next);
      return next;
    });
    return item.temp_id;
  }, []);

  const syncNow = useCallback(async () => {
    if (!online || queue.length === 0) return;
    setSyncing(true);
    try {
      await syncBatch(queue);
      setQueue([]);
      saveQueue([]);
    } finally {
      setSyncing(false);
    }
  }, [online, queue]);

  useEffect(() => {
    if (online && queue.length) syncNow();
  }, [online, queue.length, syncNow]);

  return { online, queue, syncing, enqueue, syncNow };
}
