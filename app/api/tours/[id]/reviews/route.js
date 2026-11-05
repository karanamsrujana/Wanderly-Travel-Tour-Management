import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';
import { requireRole, json } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const tourId = Number(params.id);
    const db = await mongoDb();
    const reviews = await db.collection('reviews').find({ tourId }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray();
    const dist = await db.collection('reviews').aggregate([
      { $match: { tourId } }, { $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: -1 } }]).toArray();
    const total = reviews.length;
    const avg = total ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : null;
    return json({ reviews, distribution: dist, average: avg, total });
  } catch (e) { console.error(e); return json({ reviews: [], distribution: [], average: null, total: 0 }); }
}

export async function POST(req, { params }) {
  const { user, error } = await requireRole('customer', 'admin');
  if (error) return error;
  try {
    const tourId = Number(params.id);
    const b = await req.json();
    const rating = Number(b.rating);
    if (!(rating >= 1 && rating <= 5)) return json({ error: 'Rating must be 1 to 5' }, 400);
    if (!b.comment || b.comment.trim().length < 5) return json({ error: 'Write at least 5 characters' }, 400);
    // only travellers with a booking may review (cross-database rule: SQL checks, Mongo stores)
    const ok = await query("SELECT 1 FROM bookings WHERE user_id=? AND tour_id=? AND status IN ('confirmed','completed') LIMIT 1", [user.id, tourId]);
    if (!ok.length) return json({ error: 'Book this tour before reviewing it' }, 403);
    const db = await mongoDb();
    await db.collection('reviews').insertOne({
      tourId, userId: user.id, userName: user.name, rating, title: (b.title || '').slice(0, 80),
      comment: b.comment.trim().slice(0, 1000),
      tags: Array.isArray(b.tags) ? b.tags.slice(0, 5) : [], createdAt: new Date() });
    return json({ ok: true }, 201);
  } catch (e) {
    if (e.code === 11000) return json({ error: 'You have already reviewed this tour' }, 409);
    console.error(e); return json({ error: 'Server error' }, 500);
  }
}
