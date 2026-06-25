import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize real Firebase for Auth only
const app = initializeApp(firebaseConfig);
export const auth = getAuth();

// Mock Firestore object for import compatibility
export const db = { _type: 'firestore-mock' };

// --- RESILIENT HYBRID STORE ---
// Helper to get local storage data
function getLocalCollection(collectionName: string): any[] {
  try {
    const data = localStorage.getItem(`ks_db_${collectionName}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to parse local collection", e);
  }

  // Pre-seed search products to provide a gorgeous experience on first load
  if (collectionName === 'products') {
    const seeds = [
      {
        id: 'seed-tomato',
        supplierId: 'seed-farmer-1',
        name: 'Organic Tomatoes',
        category: 'Vegetables',
        price: 40,
        unit: 'kg',
        quantity: 50,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
        status: 'Listed',
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed-milk',
        supplierId: 'seed-farmer-2',
        name: 'Fresh Milk',
        category: 'Dairy',
        price: 60,
        unit: 'liter',
        quantity: 30,
        image: 'https://images.unsplash.com/photo-1550583724-b2692bcfff9e?auto=format&fit=crop&w=200&q=80',
        status: 'Listed',
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed-wheat',
        supplierId: 'seed-farmer-1',
        name: 'Farm Wheat Flour',
        category: 'Grains',
        price: 45,
        unit: 'kg',
        quantity: 100,
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=200&q=80',
        status: 'Listed',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('ks_db_products', JSON.stringify(seeds));
    return seeds;
  }
  return [];
}

function saveLocalCollection(collectionName: string, items: any[]) {
  try {
    localStorage.setItem(`ks_db_${collectionName}`, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save local collection", e);
  }
}

// Shared active listeners for mock real-time updates
type Listener = {
  path: string;
  constraints: any[];
  onNext: (snapshot: any) => void;
};
const localListeners: Listener[] = [];

function triggerLocalListeners(collectionName: string) {
  const items = getLocalCollection(collectionName);
  const matchedListeners = localListeners.filter(l => l.path === collectionName);

  matchedListeners.forEach(l => {
    let filtered = [...items];
    l.constraints.forEach(c => {
      if (c && c._type === 'where') {
        const { field, op, value } = c;
        filtered = filtered.filter(item => {
          const itemVal = item[field];
          if (op === '==') return itemVal === value;
          if (op === '>=') return itemVal >= value;
          if (op === '<=') return itemVal <= value;
          return true;
        });
      }
    });

    const docs = filtered.map(item => ({
      id: item.id || item.uid,
      data: () => item,
      ...item
    }));

    l.onNext({
      docs,
      forEach: (cb: any) => docs.forEach(cb)
    });
  });
}

// Transparent Firestore Mock Wrappers
export function collection(databaseInstance: any, name: string) {
  return { _type: 'collection', path: name };
}

export function doc(databaseInstance: any, collectionOrPath: any, ...childPaths: string[]) {
  if (collectionOrPath && collectionOrPath._type === 'collection') {
    return {
      _type: 'doc',
      collectionName: collectionOrPath.path,
      id: childPaths[0],
      path: `${collectionOrPath.path}/${childPaths[0]}`
    };
  }
  const fullPath = [collectionOrPath, ...childPaths].join('/');
  const segments = fullPath.split('/');
  return {
    _type: 'doc',
    collectionName: segments[0],
    id: segments[1],
    path: fullPath
  };
}

export function query(collectionRef: any, ...constraints: any[]) {
  return { _type: 'query', collectionRef, constraints };
}

export function where(field: string, op: string, value: any) {
  return { _type: 'where', field, op, value };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export async function addDoc(collectionRef: any, data: any) {
  const collectionName = collectionRef.path;
  const newId = Math.random().toString(36).substring(2, 10);
  const docData = {
    id: newId,
    uid: newId,
    ...data,
    createdAt: data.createdAt === 'serverTimestamp' || !data.createdAt ? new Date().toISOString() : data.createdAt
  };

  // Always write locally for resilience
  const items = getLocalCollection(collectionName);
  items.push(docData);
  saveLocalCollection(collectionName, items);
  triggerLocalListeners(collectionName);

  // Attempt write to Neon DB Postgres
  try {
    const res = await fetch('/api/db/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, data: { ...data, id: newId, uid: newId } })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e: any) {
    console.warn("Neon DB addDoc failed, using local cache fallback:", e.message);
  }

  return { id: newId };
}

export async function setDoc(docRef: any, data: any) {
  const { collectionName, id } = docRef;
  const docData = { id, uid: id, ...data };

  // Always write locally for resilience
  const items = getLocalCollection(collectionName);
  const index = items.findIndex(item => item.id === id || item.uid === id);
  if (index !== -1) {
    items[index] = docData;
  } else {
    items.push(docData);
  }
  saveLocalCollection(collectionName, items);
  triggerLocalListeners(collectionName);

  // Attempt write to Neon DB Postgres
  try {
    const res = await fetch('/api/db/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, docId: id, data: docData })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e: any) {
    console.warn("Neon DB setDoc failed, using local cache fallback:", e.message);
  }
}

export async function getDoc(docRef: any) {
  const { collectionName, id } = docRef;

  // Attempt to fetch from Neon DB Postgres first
  try {
    const res = await fetch(`/api/db/get?collection=${collectionName}&docId=${id}`);
    if (res.ok) {
      const data = await res.json();
      
      // Update local storage cache
      const items = getLocalCollection(collectionName);
      const index = items.findIndex(item => item.id === id || item.uid === id);
      if (index !== -1) {
        items[index] = data;
      } else {
        items.push(data);
      }
      saveLocalCollection(collectionName, items);

      return {
        exists: () => true,
        data: () => data
      };
    }
  } catch (e: any) {
    console.warn("Neon DB getDoc failed, using local cache fallback:", e.message);
  }

  // Fallback to local
  const items = getLocalCollection(collectionName);
  const found = items.find(item => item.id === id || item.uid === id);
  return {
    exists: () => !!found,
    data: () => found
  };
}

export async function updateDoc(docRef: any, data: any) {
  const { collectionName, id } = docRef;

  // Always write locally for resilience
  const items = getLocalCollection(collectionName);
  const index = items.findIndex(item => item.id === id || item.uid === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    saveLocalCollection(collectionName, items);
    triggerLocalListeners(collectionName);
  }

  // Attempt update to Neon DB Postgres
  try {
    const res = await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, docId: id, data })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e: any) {
    console.warn("Neon DB updateDoc failed, using local cache fallback:", e.message);
  }
}

export async function deleteDoc(docRef: any) {
  const { collectionName, id } = docRef;

  // Always delete locally for resilience
  const items = getLocalCollection(collectionName);
  const updatedItems = items.filter(item => item.id !== id && item.uid !== id);
  saveLocalCollection(collectionName, updatedItems);
  triggerLocalListeners(collectionName);

  // Attempt delete from Neon DB Postgres
  try {
    const res = await fetch('/api/db/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, docId: id })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e: any) {
    console.warn("Neon DB deleteDoc failed, using local cache fallback:", e.message);
  }
}

export function onSnapshot(queryOrRef: any, onNext: (snap: any) => void, onError?: (err: any) => void) {
  const isQuery = queryOrRef._type === 'query';
  const collectionName = isQuery ? queryOrRef.collectionRef.path : queryOrRef.path;
  const constraints = isQuery ? queryOrRef.constraints : [];

  const listener: Listener = {
    path: collectionName,
    constraints,
    onNext
  };
  localListeners.push(listener);

  const emitData = (items: any[]) => {
    let filtered = [...items];
    constraints.forEach(c => {
      if (c && c._type === 'where') {
        const { field, op, value } = c;
        filtered = filtered.filter(item => {
          const itemVal = item[field];
          if (op === '==') return itemVal === value;
          if (op === '>=') return itemVal >= value;
          if (op === '<=') return itemVal <= value;
          return true;
        });
      }
    });

    const docs = filtered.map(item => ({
      id: item.id || item.uid,
      data: () => item,
      ...item
    }));

    onNext({
      docs,
      forEach: (cb: any) => docs.forEach(cb)
    });
  };

  // 1. Trigger immediately with local cache
  const localItems = getLocalCollection(collectionName);
  emitData(localItems);

  // 2. Fetch from Neon DB Postgres immediately to sync state
  const fetchFromBackend = async () => {
    try {
      const res = await fetch(`/api/db/list?collection=${collectionName}`);
      if (res.ok) {
        const backendItems = await res.json();
        
        // Merge backend items into local storage cache
        const local = getLocalCollection(collectionName);
        const merged = [...local];
        
        backendItems.forEach((bItem: any) => {
          const idx = merged.findIndex(l => l.id === bItem.id || l.uid === bItem.uid);
          if (idx !== -1) {
            merged[idx] = bItem;
          } else {
            merged.push(bItem);
          }
        });
        
        saveLocalCollection(collectionName, merged);
        emitData(merged);
      }
    } catch (e: any) {
      console.warn(`Neon DB list fetch for ${collectionName} failed:`, e.message);
    }
  };

  fetchFromBackend();

  // 3. Set up periodic poll every 10 seconds to keep clients synchronized
  const intervalId = setInterval(fetchFromBackend, 10000);

  return () => {
    clearInterval(intervalId);
    const idx = localListeners.indexOf(listener);
    if (idx !== -1) {
      localListeners.splice(idx, 1);
    }
  };
}

// Retain name and logic for full compatibility with existing initialization flow in App.tsx
export async function syncLocalDataToFirestore() {
  const collectionsToSync = ['users', 'products', 'orders', 'subscriptions'];
  
  for (const colName of collectionsToSync) {
    try {
      const localData = localStorage.getItem(`ks_db_${colName}`);
      if (localData) {
        const items = JSON.parse(localData);
        for (const item of items) {
          const docId = item.id || item.uid;
          if (docId) {
            await fetch('/api/db/set', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ collection: colName, docId, data: item })
            });
          }
        }
        console.log(`Successfully synchronized ${colName} to Neon DB.`);
      }
    } catch (e) {
      console.warn(`Failed to sync ${colName} to Neon DB:`, e);
    }
  }

  // Also sync current user if stored locally in ks_session_user
  try {
    const sessionUserJson = localStorage.getItem('ks_session_user');
    if (sessionUserJson) {
      const sUser = JSON.parse(sessionUserJson);
      const docId = sUser.uid;
      if (docId) {
        await fetch('/api/db/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection: 'users', docId, data: sUser })
        });
        console.log('Successfully synchronized current user session to Neon DB.');
      }
    }
  } catch (e) {
    console.warn("Failed to sync session user to Neon DB:", e);
  }
}
