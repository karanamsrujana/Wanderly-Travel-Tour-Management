'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './Providers';
import { api } from '@/lib/client';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  }
  return (
    <nav className="nav">
      <div className="wrap">
        <Link href="/" className="brand">Wander<b>ly</b></Link>
        <Link href="/">Tours</Link>
        {user && <Link href="/bookings">{user.role === 'admin' ? 'All bookings' : 'My bookings'}</Link>}
        {user?.role === 'admin' && <Link href="/admin">Admin</Link>}
        {user ? (
          <>
            <span>{user.name}</span>
            <button onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
