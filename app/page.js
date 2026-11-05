'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, inr, fmtDate } from '@/lib/client';

export default function Home() {
  const [tours, setTours] = useState([]);
  const [dests, setDests] = useState([]);
  const [f, setF] = useState({ q: '', destination: '', difficulty: '', maxPrice: '', sort: 'soonest' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => { api('/api/destinations').then(setDests).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
      setLoading(true);
      api('/api/tours?' + qs).then((d) => { setTours(d); setErr(''); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <main className="wrap">
      <section className="hero">
        <h1>Guided tours, booked in minutes.</h1>
        <p>From tea estates in Munnar to temples in Kyoto. Search by place or theme, compare dates and book seats with a local guide.</p>
        <div className="filters">
          <input type="search" placeholder="Search tours, e.g. waterfalls, diving, fort" value={f.q} onChange={set('q')} aria-label="Search tours" />
          <select value={f.destination} onChange={set('destination')} aria-label="Destination">
            <option value="">All destinations</option>
            {dests.map((d) => <option key={d.destination_id} value={d.destination_id}>{d.name}</option>)}
          </select>
          <select value={f.difficulty} onChange={set('difficulty')} aria-label="Difficulty">
            <option value="">Any difficulty</option><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
          </select>
          <select value={f.maxPrice} onChange={set('maxPrice')} aria-label="Maximum price">
            <option value="">Any price</option><option value="20000">Up to ₹20,000</option><option value="50000">Up to ₹50,000</option><option value="100000">Up to ₹1,00,000</option>
          </select>
          <select value={f.sort} onChange={set('sort')} aria-label="Sort">
            <option value="soonest">Soonest departure</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="duration">Shortest trip</option>
          </select>
        </div>
      </section>
      {err && <div className="msg err">{err}</div>}
      {loading ? <p className="empty">Loading tours…</p> : tours.length === 0 ? <p className="empty">No tours match these filters. Try clearing the search.</p> : (
        <div className="grid">
          {tours.map((t) => (
            <Link key={t.tour_id} href={`/tours/${t.tour_id}`} className="ticket">
              <div className="main">
                <h3>{t.title}</h3>
                <p className="meta">{t.destination}, {t.country} · {t.duration_days} days · departs {fmtDate(t.start_date)}</p>
                <span className={`pill ${t.difficulty}`}>{t.difficulty}</span>
                <span className={`pill ${t.status}`}>{t.status === 'open' ? `${t.available_seats} seats left` : t.status}</span>
                {t.avg_rating && <span className="stars" title={`${t.review_count} reviews`}> ★ {t.avg_rating}</span>}
              </div>
              <div className="stub"><span className="emoji">{t.cover_emoji || '🧭'}</span><span className="price">{inr(t.price)}</span><small>per person</small></div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
