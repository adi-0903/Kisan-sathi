import { get, set, clear } from 'idb-keyval';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export async function clearAllData() {
  await clear();
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace('/');
}

export function useSyncState<T>(key: string, initialValue: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const localKey = user ? `${user.uid}_${key}` : key;
    
    // 1. Instant load from IndexedDB cache
    get(localKey).then((val) => {
      if (isMounted && val !== undefined) {
        setState(val);
      } else if (isMounted) {
        setState(initialValue);
      }
    });

    // 2. Fetch fresh state from NeonDB
    if (user) {
      const docId = `${user.uid}_${key}`;
      fetch(`/api/db/get?collection=sync_state&docId=${docId}`, {
        headers: { 'x-session-uid': user.uid }
      })
      .then(res => {
        if (res.status === 404) {
          if (isMounted) {
            setState(initialValue);
            set(localKey, initialValue); // Sync local cache
          }
          return null;
        }
        if (res.ok) return res.json();
      })
      .then(data => {
        if (isMounted && data && data.value !== undefined) {
          setState(data.value);
          set(localKey, data.value); // Sync local cache
        }
      })
      .catch(e => console.warn(`NeonDB fetch failed for ${key}:`, e));
    }
    
    return () => { isMounted = false; };
  }, [key, user]);

  const setAndSave = (newValue: T) => {
    const localKey = user ? `${user.uid}_${key}` : key;
    setState(newValue);
    set(localKey, newValue);
    
    if (user) {
      const docId = `${user.uid}_${key}`;
      fetch('/api/db/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-uid': user.uid
        },
        body: JSON.stringify({
          collection: 'sync_state',
          docId,
          data: { value: newValue, updatedAt: new Date().toISOString() }
        })
      }).catch(e => console.error(`NeonDB set failed for ${key}:`, e));
    }
  };

  return [state, setAndSave];
}

export function useGlobalSyncState<T>(key: string, initialValue: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    // Consumers fetch aggregated data across all farmers
    if (user) {
      fetch(`/api/db/aggregate?keySuffix=${key}`, {
        headers: { 'x-session-uid': user.uid }
      })
      .then(res => {
        if (res.ok) return res.json();
      })
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          // Cast data back to T (assumes T is array)
          setState(data as unknown as T);
        }
      })
      .catch(e => console.warn(`NeonDB aggregate fetch failed for ${key}:`, e));
    }
    
    return () => { isMounted = false; };
  }, [key, user]);

  const setAndSave = (newValue: T) => {
    // Read-only hook for global aggregated state
    console.warn("useGlobalSyncState is read-only. Cannot save global state directly.");
  };

  return [state, setAndSave];
}
