import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';

export type UserRole = 'consumer' | 'supplier';

export type User = {
  uid: string;
  name: string;
  email: string | null;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  village?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  pin?: string;
  landSize?: string;
};

export type PendingVerification = {
  step: 'PHONE' | 'OTP' | 'DETAILS';
  name: string;
  phone: string;
  role?: UserRole;
  village?: string;
  state?: string;
  district?: string;
  landSize?: string;
} | null;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  pendingVerification: PendingVerification;
  setPendingVerification: (data: PendingVerification) => void;
  login: (phone: string, pin: string) => Promise<boolean>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const withTimeout = <T,>(promise: Promise<T>, ms: number = 4000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationState, setPendingVerificationState] = useState<PendingVerification>(() => {
    const pendingJson = sessionStorage.getItem('ks_pending_verification');
    if (pendingJson) {
      try {
        return JSON.parse(pendingJson);
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    // 1. Recover standard session immediately from localStorage for ultra-fast loading & offline fallback
    try {
      const localSession = localStorage.getItem('ks_session_user');
      if (localSession) {
        setUser(JSON.parse(localSession));
        setLoading(false);
      }
    } catch (e) {
      console.warn("Failed to retrieve local user session", e);
    }

    // 2. Setup Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            setUser(userData);
            localStorage.setItem('ks_session_user', JSON.stringify(userData));
          }
        } catch (dbErr) {
          console.warn("Firestore user fetch failed, sticking to local storage if available", dbErr);
        }
      } else {
        const isLocalOnly = localStorage.getItem('ks_is_local_only');
        if (!isLocalOnly) {
          setUser(null);
          localStorage.removeItem('ks_session_user');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const setPendingVerification = (data: PendingVerification) => {
    setPendingVerificationState(data);
    if (data) {
      sessionStorage.setItem('ks_pending_verification', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('ks_pending_verification');
    }
  };

  const getFakeEmail = (phone: string) => `${phone.replace(/\D/g, '')}@farm.app.local`;
  const getFakePassword = (pin: string) => `${pin}000000`.substring(0, 6);

  const login = async (phone: string, pin: string) => {
    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const email = getFakeEmail(cleanedPhone);
      const password = getFakePassword(pin);
      
      try {
        await withTimeout(signInWithEmailAndPassword(auth, email, password));
        return true;
      } catch (authErr: any) {
        console.warn("Firebase Auth sign-in failed, checking safe local fallback:", authErr.message);
        
        // Let's implement local validation using users collection (this works offline/local-first as well)
        let userData: any = null;
        let foundUser = false;

        // Try checking by explicit local user ID 'user_' + cleanedPhone first
        const docRef = doc(db, 'users', 'user_' + cleanedPhone);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          userData = docSnap.data();
          foundUser = true;
        } else {
          // Check if we can find a user in our resilient local storage ks_db_users by matching phone numbers
          const localUsersJson = localStorage.getItem('ks_db_users');
          if (localUsersJson) {
            try {
              const localUsers = JSON.parse(localUsersJson);
              const matched = localUsers.find((u: any) => u.phone && u.phone.replace(/\D/g, '') === cleanedPhone);
              if (matched) {
                userData = matched;
                foundUser = true;
              }
            } catch (err) {
              console.warn("Error parsing local users db", err);
            }
          }
        }
        
        if (foundUser && userData) {
          // Validate stored pin 
          if (userData.pin === pin || getFakePassword(userData.pin || '') === password) {
            setUser(userData);
            localStorage.setItem('ks_session_user', JSON.stringify(userData));
            localStorage.setItem('ks_is_local_only', 'true');
            return true;
          }
        }
        
        throw new Error("No account found for this phone number. Please register first.");
      }
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || "Failed to sign in. Check your phone and Security Code.");
    }
  };

  const register = async (data: any) => {
    const cleanedPhone = data.phone.replace(/\D/g, '');
    const email = getFakeEmail(cleanedPhone);
    const password = getFakePassword(data.pin);

    try {
      // 1. If we are already authenticated in Firebase (via real Phone Auth OTP)
      if (auth.currentUser && data.uid === auth.currentUser.uid) {
        const authenticatedUser = { 
          uid: auth.currentUser.uid,
          name: data.name,
          email: auth.currentUser.email || email,
          role: data.role || 'supplier',
          phone: data.phone,
          village: data.village,
          state: data.state,
          district: data.district,
          city: data.city,
          pincode: data.pincode,
          pin: data.pin,
          landSize: data.landSize
        };
        
        await setDoc(doc(db, 'users', auth.currentUser.uid), authenticatedUser);
        await withTimeout(updateProfile(auth.currentUser, { displayName: data.name }));
        
        setUser(authenticatedUser);
        localStorage.setItem('ks_session_user', JSON.stringify(authenticatedUser));
        localStorage.removeItem('ks_is_local_only');
        setPendingVerification(null);
        return;
      }

      // 2. Otherwise fall back to the standard flow
      try {
        const result = await withTimeout(createUserWithEmailAndPassword(auth, email, password));
        const authenticatedUser = { 
          uid: result.user.uid,
          name: data.name,
          email: email,
          role: data.role || 'supplier',
          phone: data.phone,
          village: data.village,
          state: data.state,
          district: data.district,
          city: data.city,
          pincode: data.pincode,
          pin: data.pin,
          landSize: data.landSize
        };
        
        await setDoc(doc(db, 'users', result.user.uid), authenticatedUser);
        await withTimeout(updateProfile(result.user, { displayName: data.name }));
        
        setUser(authenticatedUser);
        localStorage.setItem('ks_session_user', JSON.stringify(authenticatedUser));
        localStorage.removeItem('ks_is_local_only');
      } catch (authErr: any) {
        console.warn("Firebase Auth create user failed, completed registration in Local mode:", authErr.message);
        const localUid = 'user_' + cleanedPhone;
        const newUser: User = {
          uid: localUid,
          name: data.name,
          email: email,
          role: data.role || 'supplier',
          phone: data.phone,
          village: data.village,
          state: data.state,
          district: data.district,
          city: data.city,
          pincode: data.pincode,
          pin: data.pin, // store pin for local-first matching
          landSize: data.landSize
        };
        
        // Save locally to mock firestore
        try {
          await setDoc(doc(db, 'users', localUid), newUser);
        } catch (e) {
          console.error("Local setDoc failed", e);
        }
        
        setUser(newUser);
        localStorage.setItem('ks_session_user', JSON.stringify(newUser));
        localStorage.setItem('ks_is_local_only', 'true');
      }
      setPendingVerification(null);
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || "Failed to create account.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setPendingVerification(null);
    localStorage.removeItem('ks_session_user');
    localStorage.removeItem('ks_is_local_only');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    
    try {
      await setDoc(doc(db, 'users', user.uid), updatedUser);
    } catch (e) {
      console.warn("Firestore update user details failed, saving locally:", e);
    }
    
    setUser(updatedUser);
    localStorage.setItem('ks_session_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, pendingVerification: pendingVerificationState, setPendingVerification, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
