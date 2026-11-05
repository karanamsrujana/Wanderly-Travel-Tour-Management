'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';

export default function Login() {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const { setUser } = useAuth();
  const router = useRouter();
  async function submit(e) {
    e.preventDefault();
    try {
      const d = await api('/api/auth/login', { method: 'POST', body: f });
      setUser(d.user);
      router.push(d.user.role === 'admin' ? '/admin' : '/');
    } catch (e2) { setErr(e2.message); }
  }
  return (
    <main className="wrap"><div className="panel narrow">
      <h2>Log in</h2>
      <form onSubmit={submit}>
        <label htmlFor="e">Email</label><input id="e" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <label htmlFor="p">Password</label><input id="p" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {err && <div className="msg err">{err}</div>}
        <p style={{ marginTop: '1rem' }}><button className="btn">Log in</button></p>
      </form>
      <p className="meta">New here? <Link href="/register">Create an account</Link></p>
    </div></main>
  );
}
