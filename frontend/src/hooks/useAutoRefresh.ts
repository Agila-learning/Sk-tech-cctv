import { useEffect, useState } from 'react';

export default function useAutoRefresh(refreshFn: () => void | Promise<void>, intervalMs: number = 300000) {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    const tvMode = localStorage.getItem('sk_tv_mode') === 'true';
    setIsEnabled(tvMode);

    // Listen for changes
    const handleStorageChange = (e: any) => {
      if (e.type === 'tvModeChange' || e.key === 'sk_tv_mode') {
        setIsEnabled(localStorage.getItem('sk_tv_mode') === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tvModeChange', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tvModeChange', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) return;
    const interval = setInterval(() => {
      console.log(`[TV Mode] Auto-refreshing data...`);
      refreshFn();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [refreshFn, intervalMs, isEnabled]);

  return isEnabled;
}
