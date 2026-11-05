'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, inr, fmtDate } from '@/lib/client';
import { useAuth } from '@/components/Providers';

export default function Bookings() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const load = () => api('/api/bookings').then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { if (user) load(); }, [user]);

  async function act(id, action) {
    if (action === 'cancel' && !confirm('Cancel this booking? Your seats will be released and the payment refunded.')) return;
    try { await api(`/api/bookings/${id}`, { method: 'PATCH', body: { action } }); setErr(''); load(); }
    catch (e) { setErr(e.message); }
  }

  if (loading) return <main className="wrap"><p className="empty">Loading…</p></main>;
  if (!user) return <main className="wrap"><p className="empty"><Link href="/login">Log in</Link> to see your bookings.</p></main>;
  const admin = user.role === 'admin';

  return (
    <main className="wrap" style={{ paddingTop: '2rem' }}>
      <h1>{admin ? 'All bookings' : 'My bookings'}</h1>
      {err && <div className="msg err">{err}</div>}
      {rows.length === 0 ? <p className="empty">No bookings yet. <Link href="/">Browse tours</Link></p> : (
        <div className="panel tablewrap"><table>
          <thead><tr><th>#</th>{admin && <th>Customer</th>}<th>Tour</th><th>Departs</th><th>Seats</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows.map((b) => (
            <tr key={b.booking_id}>
              <td>{b.booking_id}</td>{admin && <td>{b.customer}</td>}
              <td><Link href={`/tours/${b.tour_id}`}>{b.tour}</Link></td><td>{fmtDate(b.start_date)}</td><td>{b.seats}</td><td>{inr(b.total_amount)}</td>
              <td>{b.payment_method} <span className={`pill ${b.payment_status}`}>{b.payment_status}</span></td>
              <td><span className={`pill ${b.status}`}>{b.status}</span></td>
              <td>
                {b.status === 'confirmed' && <button className="btn danger sm" onClick={() => act(b.booking_id, 'cancel')}>Cancel</button>}{' '}
                {admin && b.status === 'confirmed' && <button className="btn ghost sm" onClick={() => act(b.booking_id, 'complete')}>Mark completed</button>}
              </td>
            </tr>))}</tbody>
        </table></div>
      )}
    </main>
  );
}
