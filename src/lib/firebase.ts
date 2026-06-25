// Mock Firebase Auth and App configuration
export const db = { _type: 'firestore-mock' };

// Mock Firebase Auth state & listeners
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
}

let mockCurrentUser: MockUser | null = null;
const authListeners: Array<(user: MockUser | null) => void> = [];

// Try to recover user session from sessionStorage on load
try {
  const localSession = sessionStorage.getItem('ks_session_user');
  if (localSession) {
    const parsed = JSON.parse(localSession);
    mockCurrentUser = {
      uid: parsed.uid || 'user_guest',
      email: parsed.email || null,
      displayName: parsed.name || null,
      phoneNumber: parsed.phone || null
    };
  }
} catch (e) {
  console.warn("Mock auth restore session failed", e);
}

export const auth = {
  get currentUser() {
    return mockCurrentUser;
  }
};

export const browserSessionPersistence = 'session';

export type ConfirmationResult = any;

export async function setPersistence(authInstance: any, persistenceType: any) {
  return Promise.resolve();
}

const getFakePassword = (pin: string) => `${pin}000000`.substring(0, 6);

export async function signInWithEmailAndPassword(authInstance: any, email: string, pinCodeFakePassword: any) {
  const phone = email.split('@')[0];
  
  try {
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin: pinCodeFakePassword })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        mockCurrentUser = {
          uid: data.user.uid || `user_${phone}`,
          email: email,
          displayName: data.user.name || null,
          phoneNumber: data.user.phone || phone,
        };
        triggerAuthListeners();
        return { user: mockCurrentUser };
      }
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Invalid PIN");
    }
  } catch (err: any) {
    console.warn("Mock signin fetch failed, falling back to local verification:", err.message);
    if (err.message === "Invalid PIN" || err.message === "User not found") {
      throw err;
    }
  }
  
  // Try checking ks_db_users local cache if backend failed
  try {
    const localUsersJson = localStorage.getItem('ks_db_users');
    if (localUsersJson) {
      const localUsers = JSON.parse(localUsersJson);
      const matched = localUsers.find((u: any) => u.phone && u.phone.replace(/\D/g, '') === phone);
      if (matched && (matched.pin === pinCodeFakePassword || getFakePassword(matched.pin || '') === pinCodeFakePassword)) {
        mockCurrentUser = {
          uid: matched.uid || `user_${phone}`,
          email: email,
          displayName: matched.name || null,
          phoneNumber: matched.phone || phone,
        };
        triggerAuthListeners();
        return { user: mockCurrentUser };
      }
    }
  } catch (e) {
    console.warn("Local storage cache authentication check failed", e);
  }

  throw new Error("auth/user-not-found");
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, pinCodeFakePassword: any) {
  const phone = email.split('@')[0];
  mockCurrentUser = {
    uid: `user_${phone}`,
    email: email,
    displayName: 'Farmer',
    phoneNumber: phone
  };
  triggerAuthListeners();
  return { user: mockCurrentUser };
}

export async function signOut(authInstance: any) {
  mockCurrentUser = null;
  triggerAuthListeners();
  return Promise.resolve();
}

export function onAuthStateChanged(authInstance: any, callback: (user: MockUser | null) => void) {
  authListeners.push(callback);
  // Trigger callback immediately
  setTimeout(() => {
    callback(mockCurrentUser);
  }, 0);
  return () => {
    const index = authListeners.indexOf(callback);
    if (index !== -1) {
      authListeners.splice(index, 1);
    }
  };
}

function triggerAuthListeners() {
  authListeners.forEach(cb => {
    try {
      cb(mockCurrentUser);
    } catch (e) {
      console.error("Error triggering auth listener:", e);
    }
  });
}

export async function updateProfile(userInstance: any, profileUpdates: { displayName?: string; photoURL?: string }) {
  if (mockCurrentUser) {
    mockCurrentUser.displayName = profileUpdates.displayName || mockCurrentUser.displayName;
  }
  return Promise.resolve();
}

// Mock Recaptcha for complete local compatibility
export class RecaptchaVerifier {
  constructor(authInstance: any, elementId: string, options: any) {
    console.log("Mock RecaptchaVerifier initialized for element:", elementId);
  }
  async verify() {
    return Promise.resolve("mock-recaptcha-token");
  }
}

export async function signInWithPhoneNumber(authInstance: any, phone: string, appVerifier: any) {
  return Promise.resolve({
    confirm: async (code: string) => {
      mockCurrentUser = {
        uid: `user_${phone.replace(/\D/g, '')}`,
        email: `${phone.replace(/\D/g, '')}@farm.app.local`,
        displayName: 'Farmer',
        phoneNumber: phone
      };
      triggerAuthListeners();
      return {
        user: mockCurrentUser
      };
    }
  });
}


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

function getAuthHeaders(extraHeaders: any = {}) {
  const headers: any = { ...extraHeaders };
  if (mockCurrentUser && mockCurrentUser.uid) {
    headers['x-session-uid'] = mockCurrentUser.uid;
  }
  return headers;
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
    const res = await fetch(`/api/db/get?collection=${collectionName}&docId=${id}`, {
      headers: getAuthHeaders()
    });
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
      const res = await fetch(`/api/db/list?collection=${collectionName}`, {
        headers: getAuthHeaders()
      });
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
