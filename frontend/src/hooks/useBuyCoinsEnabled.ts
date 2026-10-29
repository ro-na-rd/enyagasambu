'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export function useBuyCoinsEnabled() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/settings')
      .then(({ data }) => {
        if (active) setAllowed(data?.settings?.allow_buy_coins === 'true');
      })
      .catch(() => {
        if (active) setAllowed(false);
      });
    return () => { active = false; };
  }, []);

  const privileged = user?.role === 'admin' || user?.executive_role === 'CEO';
  return allowed || privileged;
}
