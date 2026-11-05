import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';
import { requireRole, json, dbError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);
    const rows = await query(
      `SELECT c.*, t.guide_id, d.description AS destination_info, d.best_season,
              g.languages AS guide_languages, g.experience_years AS guide_experience
       FROM v_tour_catalog c JOIN destinations d ON d.destination_id=c.destination_id
       LEFT JOIN tours t ON t.tour_id=c.tour_id LEFT JOIN guides g ON g.guide_id=t.guide_id
       WHERE c.tour_id=?`, [id]);
    if (!rows[0]) return json({ error: 'Tour not found' }, 404);
    const hotels = await query(
      `SELECT h.name,h.star_rating,th.nights FROM tour_hotels th JOIN hotels h ON h.hotel_id=th.hotel_id WHERE th.tour_id=?`, [id]);
    let itinerary = null;
    try {
      const db = await mongoDb();
      itinerary = await db.collection('itineraries').findOne({ tourId: id }, { projection: { _id: 0 } });
      db.collection('activity_logs').insertOne({ action: 'view_tour', tourId: id, ts: new Date() });
    } catch {}
    return json({ ...rows[0], hotels, itinerary });
  } catch (e) { return dbError(e); }
}

export async function PUT(req, { params }) {
  const { error } = await requireRole('admin');
  if (error) return error;
  try {
    const b = await req.json();
    await query(
      `UPDATE tours SET title=?, description=?, destination_id=?, guide_id=?, duration_days=?, price=?,
              available_seats = available_seats + (? - max_seats), max_seats=?, start_date=?, end_date=?,
              difficulty=?, status=?, cover_emoji=? WHERE tour_id=?`,
      [b.title, b.description || null, b.destination_id, b.guide_id || null, b.duration_days, b.price,
       b.max_seats, b.max_seats, b.start_date, b.end_date, b.difficulty, b.status, b.cover_emoji || null, Number(params.id)]);
    return json({ ok: true });
  } catch (e) { return dbError(e); }
}

export async function DELETE(req, { params }) {
  const { error } = await requireRole('admin');
  if (error) return error;
  try {
    const r = await query('DELETE FROM tours WHERE tour_id=?', [Number(params.id)]); // trigger blocks if confirmed bookings exist
    return r.affectedRows ? json({ ok: true }) : json({ error: 'Tour not found' }, 404);
  } catch (e) { return dbError(e); }
}
