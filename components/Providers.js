'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/client';

const Ctx = createContext({ user: null, loading: true, setUser: () => {} });
export const useAuth = () => useContext(Ctx);

export default function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/api/auth/me').then((d) => setUser(d.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  return <Ctx.Provider value={{ user, setUser, loading }}>{children}</Ctx.Provider>;
}
