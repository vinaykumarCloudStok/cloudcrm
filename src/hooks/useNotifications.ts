import { useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '../services/notificationApi';
import { useAuthStore } from '../store/authStore';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const token = useAuthStore((s) => s.token);

  const refetch = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count ?? res.data ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    refetch();
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [token, refetch]);

  return { unreadCount, refetch };
}
