import { useState, useEffect } from 'react';

export function useSubscription() {
  const [installDate, setInstallDate] = useState<string | null>(null);
  // For testing purposes, you can force expiry by setting ks_force_expire in localStorage
  const [forceExpire, setForceExpire] = useState(false);

  useEffect(() => {
    let date = localStorage.getItem('ks_install_date');
    if (!date) {
      date = new Date().toISOString();
      localStorage.setItem('ks_install_date', date);
    }
    setInstallDate(date);
    setForceExpire(localStorage.getItem('ks_force_expire') === 'true');
  }, []);

  const getDaysLeft = () => {
    if (forceExpire) return 0;
    if (!installDate) return 30;
    const start = new Date(installDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const daysPassed = Math.floor(diff / (1000 * 3600 * 24));
    return Math.max(0, 30 - daysPassed);
  };

  const isExpired = getDaysLeft() <= 0;
  
  return { 
    isExpired, 
    daysLeft: getDaysLeft(),
    isPro: false // Represents real subscription status (always false for mock)
  };
}
