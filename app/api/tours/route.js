import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';
import { requireRole, json, dbError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

const SORTS = {
  soonest: 't.start_date ASC', price_asc: 't.price ASC', price_desc: 't.price DESC', duration: 't.duration_days ASC',
};

// GET /api/tours?q=&destination=&difficulty=&maxPrice=&sort=   (public)
export async function GET(req) {
  try {
    const p = new URL(req.url).searchParams;
    const where = ["t.status <> 'cancelled'"], args = [];
    let rank = '';
    const q = (p.get('q') || '').trim();
    if (q) {
      // FULL-TEXT search on tours + LIKE fallback for short words / destination names
      where.push('(MATCH(t.title,t.description) AGAINST (? IN NATURAL LANGUAGE MODE) OR t.title LIKE ? OR d.name LIKE ?)');
      args.push(q, `%${q}%`, `%${q}%`);
    }
    if (p.get('destination')) { where.push('t.destination_id = ?'); args.push(Number(p.get('destination'))); }
    if (['easy', 'moderate', 'hard'].includes(p.get('difficulty'))) { where.push('t.difficulty = ?'); args.push(p.get('difficulty')); }
    if (p.get('maxPrice')) { where.push('t.price <= ?'); args.push(Number(p.get('maxPrice'))); }
    const order = SORTS[p.get('sort')] || SORTS.soonest;

    const tours = await query(
      `SELECT t.tour_id,t.title,t.price,t.duration_days,t.start_date,t.difficulty,t.status,t.available_seats,
              t.max_seats,t.cover_emoji,d.name AS destination,d.country
       FROM tours t JOIN destinations d ON d.destination_id=t.destination_id
       WHERE ${where.join(' AND ')} ORDER BY ${order}`, args);

    // enrich with average rating from MongoDB (NoSQL aggregation) - tolerate Mongo being down
    try {
      const db = await mongoDb();
      const agg = await db.collection('reviews').aggregate([
        { $group: { _id: '$tourId', avg: { $avg: '$rating' }, n: { $sum: 1 } } }]).toArray();
      const map = Object.fromEntries(agg.map((a) => [a._id, a]));
      tours.forEach((t) => { const a = map[t.tour_id]; t.avg_rating = a ? Math.round(a.avg * 10) / 10 : null; t.review_count = a ? a.n : 0; });
      if (q) db.collection('activity_logs').insertOne({ action: 'search', query: q, ts: new Date() });
    } catch {}
    return json(tours);
  } catch (e) { return dbError(e); }
}

// POST /api/tours  (admin)
export async function POST(req) {
  const { error } = await requireRole('admin');
  if (error) return error;
  try {
    const b = await req.json();
    const need = ['title', 'destination_id', 'duration_days', 'price', 'max_seats', 'start_date', 'end_date'];
    for (const k of need) if (b[k] === undefined || b[k] === '') return json({ error: `${k} is required` }, 400);
    const r = await query(
      `INSERT INTO tours (title,description,destination_id,guide_id,duration_days,price,max_seats,available_seats,start_date,end_date,difficulty,cover_emoji)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [b.title, b.description || null, b.destination_id, b.guide_id || null, b.duration_days, b.price, b.max_seats, b.max_seats,
       b.start_date, b.end_date, b.difficulty || 'easy', b.cover_emoji || '🧭']);
    return json({ tour_id: r.insertId }, 201);
  } catch (e) { return dbError(e); }
}
