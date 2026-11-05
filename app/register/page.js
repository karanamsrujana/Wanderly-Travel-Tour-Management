'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';

export default function Register() {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const { setUser } = useAuth();
  const router = useRouter();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    try {
      const d = await api('/api/auth/register', { method: 'POST', body: f });
      setUser(d.user);
      router.push('/');
    } catch (e2) { setErr(e2.message); }
  }
  return (
    <main className="wrap"><div className="panel narrow">
      <h2>Create your account</h2>
      <form onSubmit={submit}>
        <label htmlFor="n">Full name</label><input id="n" required value={f.name} onChange={set('name')} />
        <label htmlFor="e">Email</label><input id="e" type="email" required value={f.email} onChange={set('email')} />
        <label htmlFor="ph">Phone (optional)</label><input id="ph" value={f.phone} onChange={set('phone')} />
        <label htmlFor="p">Password (8+ characters)</label><input id="p" type="password" minLength={8} required value={f.password} onChange={set('password')} />
        {err && <div className="msg err">{err}</div>}
        <p style={{ marginTop: '1rem' }}><button className="btn">Sign up</button></p>
      </form>
      <p className="meta">Already registered? <Link href="/login">Log in</Link></p>
    </div></main>
  );
}
