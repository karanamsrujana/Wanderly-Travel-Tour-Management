'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, inr, fmtDate } from '@/lib/client';
import { useAuth } from '@/components/Providers';

const blank = { title: '', description: '', destination_id: '', guide_id: '', duration_days: 3, price: 10000, max_seats: 10, start_date: '', end_date: '', difficulty: 'easy', status: 'open', cover_emoji: '🧭' };

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tours, setTours] = useState([]);
  const [dests, setDests] = useState([]);
  const [guides, setGuides] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [dform, setDform] = useState({ name: '', country: '', region: '', best_season: '', description: '' });
  const [msg, setMsg] = useState(null);

  const loadAll = () => {
    api('/api/admin/stats').then(setStats).catch((e) => setMsg({ err: e.message }));
    api('/api/tours').then(setTours).catch(() => {});
    api('/api/destinations').then(setDests).catch(() => {});
    api('/api/guides').then(setGuides).catch(() => {});
  };
  useEffect(() => { if (user?.role === 'admin') loadAll(); }, [user]);

  if (loading) return <main className="wrap"><p className="empty">Loading…</p></main>;
  if (user?.role !== 'admin') return <main className="wrap"><p className="empty">This area is for admins. <Link href="/login">Log in</Link> with an admin account.</p></main>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  async function saveTour(e) {
    e.preventDefault();
    try {
      const body = { ...form, destination_id: Number(form.destination_id), guide_id: form.guide_id ? Number(form.guide_id) : null,
        duration_days: Number(form.duration_days), price: Number(form.price), max_seats: Number(form.max_seats) };
      if (editing) await api(`/api/tours/${editing}`, { method: 'PUT', body });
      else await api('/api/tours', { method: 'POST', body });
      setMsg({ ok: editing ? 'Tour updated.' : 'Tour created.' }); setForm(blank); setEditing(null); loadAll();
    } catch (e2) { setMsg({ err: e2.message }); }
  }
  async function del(id) {
    if (!confirm('Delete this tour?')) return;
    try { await api(`/api/tours/${id}`, { method: 'DELETE' }); setMsg({ ok: 'Tour deleted.' }); loadAll(); }
    catch (e) { setMsg({ err: e.message }); }
  }
  async function addDest(e) {
    e.preventDefault();
    try { await api('/api/destinations', { method: 'POST', body: dform }); setMsg({ ok: 'Destination added.' }); setDform({ name: '', country: '', region: '', best_season: '', description: '' }); loadAll(); }
    catch (e2) { setMsg({ err: e2.message }); }
  }
  const maxRev = Math.max(1, ...(stats?.byDestination || []).map((d) => Number(d.revenue)));
  const titleOf = (id) => tours.find((t) => t.tour_id === id)?.title || `Tour #${id}`;

  return (
    <main className="wrap" style={{ paddingTop: '2rem' }}>
      <h1>Admin dashboard</h1>
      <div className="tabs">{['overview', 'tours', 'destinations'].map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setMsg(null); }}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
      {msg && <div className={`msg ${msg.err ? 'err' : 'ok'}`}>{msg.err || msg.ok}</div>}

      {tab === 'overview' && stats && (<>
        <div className="stats">
          <div className="stat"><b>{inr(stats.totals.revenue)}</b>Revenue</div>
          <div className="stat"><b>{stats.totals.bookings}</b>Active bookings</div>
          <div className="stat"><b>{stats.totals.customers}</b>Customers</div>
          <div className="stat"><b>{stats.totals.tours}</b>Tours</div>
        </div>
        <div className="cols">
          <section className="panel"><h3>Revenue by destination (view + GROUP BY)</h3>
            {stats.byDestination.map((d) => (
              <div key={d.destination_id} style={{ margin: '.5rem 0' }}>{d.destination} — {inr(d.revenue)} · {d.seats_sold} seats
                <div className="bar" style={{ width: `${(Number(d.revenue) / maxRev) * 100}%` }} /></div>))}
          </section>
          <section className="panel"><h3>Best sellers (HAVING)</h3>
            {stats.topTours.map((t) => <p key={t.tour_id}>{t.title}<br /><span className="meta">{t.seats_sold} seats · {inr(t.revenue)}</span></p>)}
            <h3>Above-average fill rate (subquery)</h3>
            {stats.hot.length ? stats.hot.map((t) => <p key={t.title} className="meta">{t.title}: {t.filled_pct}% full</p>) : <p className="meta">None yet.</p>}
          </section>
        </div>
        <div className="cols">
          <section className="panel"><h3>From MongoDB (aggregation pipelines)</h3>
            <p><b>Top rated:</b> {stats.nosql.topRated.map((r) => `${titleOf(r._id)} (${r.avg.toFixed(1)})`).join(', ') || 'no reviews yet'}</p>
            <p><b>Popular review tags:</b> {stats.nosql.tags.map((t) => `${t._id} ×${t.n}`).join(', ') || '-'}</p>
            <p><b>Most viewed:</b> {stats.nosql.mostViewed.map((v) => `${titleOf(v._id)} (${v.views})`).join(', ') || 'no views logged yet'}</p>
          </section>
          <section className="panel"><h3>Recent audit log (written by triggers)</h3>
            {stats.audit.map((a) => <p key={a.log_id} className="meta">{a.action} · {a.details}</p>)}
          </section>
        </div>
      </>)}

      {tab === 'tours' && (<>
        <form className="panel" onSubmit={saveTour}>
          <h3>{editing ? `Edit tour #${editing}` : 'Add a tour'}</h3>
          <div className="formgrid">
            <div><label>Title</label><input required value={form.title} onChange={set('title')} /></div>
            <div><label>Destination</label><select required value={form.destination_id} onChange={set('destination_id')}><option value="">Select…</option>{dests.map((d) => <option key={d.destination_id} value={d.destination_id}>{d.name}</option>)}</select></div>
            <div><label>Guide</label><select value={form.guide_id || ''} onChange={set('guide_id')}><option value="">Unassigned</option>{guides.map((g) => <option key={g.guide_id} value={g.guide_id}>{g.name}</option>)}</select></div>
            <div><label>Price (₹)</label><input type="number" min="0" required value={form.price} onChange={set('price')} /></div>
            <div><label>Days</label><input type="number" min="1" required value={form.duration_days} onChange={set('duration_days')} /></div>
            <div><label>Max seats</label><input type="number" min="1" required value={form.max_seats} onChange={set('max_seats')} /></div>
            <div><label>Start</label><input type="date" required value={fmtDate(form.start_date)} onChange={set('start_date')} /></div>
            <div><label>End</label><input type="date" required value={fmtDate(form.end_date)} onChange={set('end_date')} /></div>
            <div><label>Difficulty</label><select value={form.difficulty} onChange={set('difficulty')}><option>easy</option><option>moderate</option><option>hard</option></select></div>
            {editing && <div><label>Status</label><select value={form.status} onChange={set('status')}><option>open</option><option>closed</option><option>cancelled</option></select></div>}
            <div><label>Emoji</label><input value={form.cover_emoji || ''} onChange={set('cover_emoji')} /></div>
          </div>
          <label>Description</label><textarea rows={2} style={{ width: '100%' }} value={form.description || ''} onChange={set('description')} />
          <p style={{ marginTop: '.8rem' }}><button className="btn">{editing ? 'Save changes' : 'Create tour'}</button>{' '}
            {editing && <button type="button" className="btn ghost" onClick={() => { setEditing(null); setForm(blank); }}>Cancel edit</button>}</p>
        </form>
        <div className="panel tablewrap"><table>
          <thead><tr><th>#</th><th>Title</th><th>Destination</th><th>Departs</th><th>Price</th><th>Seats</th><th>Status</th><th></th></tr></thead>
          <tbody>{tours.map((t) => (
            <tr key={t.tour_id}><td>{t.tour_id}</td><td>{t.title}</td><td>{t.destination}</td><td>{fmtDate(t.start_date)}</td><td>{inr(t.price)}</td>
              <td>{t.available_seats}/{t.max_seats}</td><td><span className={`pill ${t.status}`}>{t.status}</span></td>
              <td><button className="btn ghost sm" onClick={async () => {
                const d = await api(`/api/tours/${t.tour_id}`);
                setForm({ ...blank, ...d, destination_id: d.destination_id, guide_id: d.guide_id || '' }); setEditing(t.tour_id); window.scrollTo(0, 0);
              }}>Edit</button>{' '}<button className="btn danger sm" onClick={() => del(t.tour_id)}>Delete</button></td></tr>))}</tbody>
        </table></div>
      </>)}

      {tab === 'destinations' && (
        <form className="panel" onSubmit={addDest}>
          <h3>Add a destination</h3>
          <div className="formgrid">
            <div><label>Name</label><input required value={dform.name} onChange={(e) => setDform({ ...dform, name: e.target.value })} /></div>
            <div><label>Country</label><input required value={dform.country} onChange={(e) => setDform({ ...dform, country: e.target.value })} /></div>
            <div><label>Region</label><input value={dform.region} onChange={(e) => setDform({ ...dform, region: e.target.value })} /></div>
            <div><label>Best season</label><input value={dform.best_season} onChange={(e) => setDform({ ...dform, best_season: e.target.value })} /></div>
          </div>
          <label>Description</label><textarea rows={2} style={{ width: '100%' }} value={dform.description} onChange={(e) => setDform({ ...dform, description: e.target.value })} />
          <p style={{ marginTop: '.8rem' }}><button className="btn">Add destination</button></p>
          <p className="meta">Existing: {dests.map((d) => d.name).join(', ')}</p>
        </form>
      )}
    </main>
  );
}
