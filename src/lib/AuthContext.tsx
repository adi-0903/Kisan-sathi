import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient, dbClient } from './dbClient';

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

const withTimeout = <T,>(promise: Promise<T>, ms: number = 15000): Promise<T> => {
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
    // 1. Recover standard session immediately from sessionStorage for ultra-fast loading & offline fallback
    try {
      const localSession = sessionStorage.getItem('ks_session_user');
      if (localSession) {
        setUser(JSON.parse(localSession));
        setLoading(false);
      }
    } catch (e) {
      console.warn("Failed to retrieve local user session", e);
    }

    // 2. Setup database auth listener
    const unsubscribe = authClient.onAuthStateChanged(async (sessionUser) => {
      if (sessionUser) {
        try {
          const docSnap = await dbClient.get('users', sessionUser.uid);
          if (docSnap.exists && docSnap.data) {
            const userData = docSnap.data as User;
            setUser(userData);
            sessionStorage.setItem('ks_session_user', JSON.stringify(userData));
          }
        } catch (dbErr) {
          console.warn("User data fetch failed, sticking to session storage if available", dbErr);
        }
      } else {
        const isLocalOnly = sessionStorage.getItem('ks_is_local_only');
        if (!isLocalOnly) {
          setUser(null);
          sessionStorage.removeItem('ks_session_user');
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
      try {
        await withTimeout(authClient.signIn(email, pin));
        return true;
      } catch (authErr: any) {
        console.warn("Auth sign-in failed, checking safe local fallback:", authErr.message);
        
        if (authErr.message === 'Invalid PIN') {
          throw new Error("Invalid Security Code. Please try again.");
        }
        
        if (authErr.message === 'timeout') {
          throw new Error("Connection timed out. Please try again.");
        }
        
        let userData: any = null;
        let foundUser = false;

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
        
        if (foundUser && userData) {
          if (userData.pin === pin || getFakePassword(userData.pin || '') === getFakePassword(pin)) {
            setUser(userData);
            sessionStorage.setItem('ks_session_user', JSON.stringify(userData));
            sessionStorage.setItem('ks_is_local_only', 'true');
            return true;
          } else {
             throw new Error("Invalid Security Code. Please try again.");
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
      const currentUser = authClient.getCurrentUser();
      if (currentUser && data.uid === currentUser.uid) {
        const authenticatedUser = { 
          uid: currentUser.uid,
          name: data.name,
          email: currentUser.email || email,
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
        
        await dbClient.set('users', currentUser.uid, authenticatedUser);
        await withTimeout(authClient.updateProfile({ displayName: data.name }));
        
        setUser(authenticatedUser);
        sessionStorage.setItem('ks_session_user', JSON.stringify(authenticatedUser));
        sessionStorage.removeItem('ks_is_local_only');
        setPendingVerification(null);
        return;
      }

      try {
        const result = await withTimeout(authClient.signUp(email, password));
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
        
        await dbClient.set('users', result.user.uid, authenticatedUser);
        await withTimeout(authClient.updateProfile({ displayName: data.name }));
        
        setUser(authenticatedUser);
        sessionStorage.setItem('ks_session_user', JSON.stringify(authenticatedUser));
        sessionStorage.removeItem('ks_is_local_only');
      } catch (authErr: any) {
        console.warn("Auth create user failed, completed registration in Local mode:", authErr.message);
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
          pin: data.pin,
          landSize: data.landSize
        };
        
        try {
          await dbClient.set('users', localUid, newUser);
        } catch (e) {
          console.error("Local set failed", e);
        }
        
        setUser(newUser);
        sessionStorage.setItem('ks_session_user', JSON.stringify(newUser));
        sessionStorage.setItem('ks_is_local_only', 'true');
      }
      setPendingVerification(null);
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || "Failed to create account.");
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.error(e);
    }
    try {
      const { clear } = await import('idb-keyval');
      await clear();
      localStorage.clear();
    } catch (e) {
      console.warn("Failed to clear local caches on logout:", e);
    }
    setUser(null);
    setPendingVerification(null);
    sessionStorage.removeItem('ks_session_user');
    sessionStorage.removeItem('ks_is_local_only');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    
    try {
      await dbClient.set('users', user.uid, updatedUser);
    } catch (e) {
      console.warn("Database update user details failed, saving locally:", e);
    }
    
    setUser(updatedUser);
    sessionStorage.setItem('ks_session_user', JSON.stringify(updatedUser));
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
