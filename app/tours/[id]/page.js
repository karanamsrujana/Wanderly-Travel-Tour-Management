'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, inr, fmtDate } from '@/lib/client';
import { useAuth } from '@/components/Providers';

export default function TourDetail({ params }) {
  const id = params.id;
  const { user } = useAuth();
  const router = useRouter();
  const [t, setT] = useState(null);
  const [rev, setRev] = useState({ reviews: [], total: 0, average: null, distribution: [] });
  const [book, setBook] = useState({ seats: 1, method: 'upi' });
  const [rf, setRf] = useState({ rating: 5, title: '', comment: '' });
  const [msg, setMsg] = useState(null);
  const [rmsg, setRmsg] = useState(null);

  const load = () => {
    api(`/api/tours/${id}`).then(setT).catch((e) => setMsg({ err: e.message }));
    api(`/api/tours/${id}/reviews`).then(setRev).catch(() => {});
  };
  useEffect(load, [id]);

  async function submitBooking(e) {
    e.preventDefault();
    if (!user) return router.push('/login');
    try {
      await api('/api/bookings', { method: 'POST', body: { tour_id: id, seats: Number(book.seats), method: book.method } });
      setMsg({ ok: 'Booking confirmed. See it under My bookings.' });
      load();
    } catch (e2) { setMsg({ err: e2.message }); }
  }
  async function submitReview(e) {
    e.preventDefault();
    try {
      await api(`/api/tours/${id}/reviews`, { method: 'POST', body: { ...rf, rating: Number(rf.rating) } });
      setRmsg({ ok: 'Thanks for your review.' });
      setRf({ rating: 5, title: '', comment: '' });
      load();
    } catch (e2) { setRmsg({ err: e2.message }); }
  }

  if (!t) return <main className="wrap">{msg?.err ? <div className="msg err">{msg.err}</div> : <p className="empty">Loading…</p>}</main>;
  const it = t.itinerary;
  const total = inr(t.price * Number(book.seats || 0));

  return (
    <main className="wrap" style={{ paddingTop: '2rem' }}>
      <p><Link href="/">← All tours</Link></p>
      <h1>{t.cover_emoji} {t.title}</h1>
      <p className="meta">{t.destination}, {t.country} · {t.duration_days} days · {fmtDate(t.start_date)} to {fmtDate(t.end_date)} · guide {t.guide_name || 'to be assigned'}</p>
      <div className="cols">
        <div>
          <section className="panel">
            <h2>About this tour</h2>
            <p>{t.description}</p>
            <p className="meta">About {t.destination}: {t.destination_info} Best season: {t.best_season}.</p>
            {t.hotels.length > 0 && (<>
              <h3>Where you stay</h3>
              {t.hotels.map((h) => <p key={h.name} className="meta">{h.name} · {'★'.repeat(h.star_rating)} · {h.nights} night{h.nights > 1 ? 's' : ''}</p>)}
            </>)}
          </section>
          {it && (
            <section className="panel">
              <h2>Day by day</h2>
              {it.days.map((d) => (
                <div key={d.day} className="day"><h3>Day {d.day}: {d.title}</h3>
                  <p className="meta">{d.activities.join(' · ')}{d.meals?.length ? ` — Meals: ${d.meals.join(', ')}` : ''}</p></div>
              ))}
              <p className="meta"><b>Included:</b> {it.inclusions?.join(', ')}. <b>Not included:</b> {it.exclusions?.join(', ')}.</p>
            </section>
          )}
          <section className="panel">
            <h2>Traveller reviews {rev.average && <span className="stars">★ {rev.average} ({rev.total})</span>}</h2>
            {rev.reviews.length === 0 && <p className="meta">No reviews yet.</p>}
            {rev.reviews.map((r, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--line)', padding: '.5rem 0' }}>
                <span className="stars">{'★'.repeat(r.rating)}</span> <b>{r.title}</b>
                <p>{r.comment}</p><p className="meta">{r.userName} · {fmtDate(r.createdAt)}</p>
              </div>
            ))}
            {user && (
              <form onSubmit={submitReview}>
                <h3 style={{ marginTop: '1rem' }}>Write a review</h3>
                <label htmlFor="rt">Rating</label>
                <select id="rt" value={rf.rating} onChange={(e) => setRf({ ...rf, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select>
                <label htmlFor="rti">Title</label><input id="rti" value={rf.title} onChange={(e) => setRf({ ...rf, title: e.target.value })} />
                <label htmlFor="rc">Your experience</label><textarea id="rc" rows={3} style={{ width: '100%' }} value={rf.comment} onChange={(e) => setRf({ ...rf, comment: e.target.value })} />
                {rmsg && <div className={`msg ${rmsg.err ? 'err' : 'ok'}`}>{rmsg.err || rmsg.ok}</div>}
                <p><button className="btn sm">Post review</button></p>
              </form>
            )}
          </section>
        </div>
        <aside className="panel" style={{ position: 'sticky', top: '1rem' }}>
          <h2>{inr(t.price)} <small className="meta">per person</small></h2>
          <p><span className={`pill ${t.status}`}>{t.status}</span> {t.available_seats} of {t.max_seats} seats left</p>
          <form onSubmit={submitBooking}>
            <label htmlFor="s">Seats</label>
            <input id="s" type="number" min={1} max={10} value={book.seats} onChange={(e) => setBook({ ...book, seats: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="m">Pay with</label>
            <select id="m" value={book.method} onChange={(e) => setBook({ ...book, method: e.target.value })} style={{ width: '100%' }}>
              <option value="upi">UPI</option><option value="card">Card</option><option value="netbanking">Net banking</option><option value="cash">Cash</option>
            </select>
            <p style={{ marginTop: '.8rem' }}><b>Total: {total}</b></p>
            {msg && <div className={`msg ${msg.err ? 'err' : 'ok'}`}>{msg.err || msg.ok}</div>}
            <button className="btn alt" disabled={t.status !== 'open'}>{user ? 'Book now' : 'Log in to book'}</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
