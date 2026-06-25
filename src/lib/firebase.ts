import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize real Firebase for Auth only
const app = initializeApp(firebaseConfig);
export const auth = getAuth();

// Mock Firestore object for import compatibility
export const db = { _type: 'firestore-mock' };

// --- IN-MEMORY CACHE STORE (NO LOCAL STORAGE) ---
const inMemoryDb: Record<string, any[]> = {};

function getLocalCollection(collectionName: string): any[] {
  if (inMemoryDb[collectionName]) {
    return inMemoryDb[collectionName];
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
    inMemoryDb[collectionName] = seeds;
    return seeds;
  }
  return [];
}

function saveLocalCollection(collectionName: string, items: any[]) {
  inMemoryDb[collectionName] = items;
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

  // Write directly to Neon DB Postgres
  try {
    const res = await fetch('/api/db/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, data: docData })
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  } catch (e: any) {
    console.error("Neon DB addDoc failed:", e.message);
    throw new Error(e.message || "Failed to save data directly to PostgreSQL");
  }

  // Update in-memory cache for immediate UI responsiveness
  const items = getLocalCollection(collectionName);
  items.push(docData);
  saveLocalCollection(collectionName, items);
  triggerLocalListeners(collectionName);

  return { id: newId };
}

export async function setDoc(docRef: any, data: any) {
  const { collectionName, id } = docRef;
  const docData = { id, uid: id, ...data };

  // Write directly to Neon DB Postgres
  try {
    const res = await fetch('/api/db/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, docId: id, data: docData })
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  } catch (e: any) {
    console.error("Neon DB setDoc failed:", e.message);
    throw new Error(e.message || "Failed to save data directly to PostgreSQL");
  }

  // Update in-memory cache for immediate UI responsiveness
  const items = getLocalCollection(collectionName);
  const index = items.findIndex(item => item.id === id || item.uid === id);
  if (index !== -1) {
    items[index] = docData;
  } else {
    items.push(docData);
  }
  saveLocalCollection(collectionName, items);
  triggerLocalListeners(collectionName);
}

export async function getDoc(docRef: any) {
  const { collectionName, id } = docRef;

  try {
    const res = await fetch(`/api/db/get?collection=${collectionName}&docId=${id}`);
    if (res.status === 404) {
      return {
        exists: () => false,
        data: () => null
      };
    }
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = await res.json();
    
    // Update in-memory cache
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
  } catch (e: any) {
    console.error("Neon DB getDoc failed:", e.message);
    throw e;
  }
}

export async function updateDoc(docRef: any, data: any) {
  const { collectionName, id } = docRef;

  // Write directly to Neon DB Postgres
  try {
    const res = await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, docId: id, data })
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  } catch (e: any) {
    console.error("Neon DB updateDoc failed:", e.message);
    throw new Error(e.message || "Failed to update data directly in PostgreSQL");
  }

  // Update in-memory cache
  const items = getLocalCollection(collectionName);
  const index = items.findIndex(item => item.id === id || item.uid === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    saveLocalCollection(collectionName, items);
    triggerLocalListeners(collectionName);
  }
}

export async function deleteDoc(docRef: any) {
  const { collectionName, id } = docRef;

  // Write directly to Neon DB Postgres
  try {
    const res = await fetch('/api/db/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: collectionName, docId: id })
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  } catch (e: any) {
    console.error("Neon DB deleteDoc failed:", e.message);
    throw new Error(e.message || "Failed to delete data directly from PostgreSQL");
  }

  // Update in-memory cache
  const items = getLocalCollection(collectionName);
  const updatedItems = items.filter(item => item.id !== id && item.uid !== id);
  saveLocalCollection(collectionName, updatedItems);
  triggerLocalListeners(collectionName);
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

  // 1. Trigger immediately with in-memory cache
  const localItems = getLocalCollection(collectionName);
  emitData(localItems);

  // 2. Fetch from Neon DB Postgres immediately to sync state
  const fetchFromBackend = async () => {
    try {
      const res = await fetch(`/api/db/list?collection=${collectionName}`);
      if (res.ok) {
        const backendItems = await res.json();
        
        // Overwrite the in-memory cache directly with backend items
        saveLocalCollection(collectionName, backendItems);
        emitData(backendItems);
      }
    } catch (e: any) {
      console.warn(`Neon DB list fetch for ${collectionName} failed:`, e.message);
      if (onError) onError(e);
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

// Retain name as a no-op for compatibility
export async function syncLocalDataToFirestore() {
  // No-op: data is directly saved to Neon DB Postgres, no local storage sync required.
}
