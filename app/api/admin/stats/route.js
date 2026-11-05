import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';
import { requireRole, json, dbError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole('admin');
  if (error) return error;
  try {
    const [totals] = await query(
      `SELECT (SELECT COUNT(*) FROM users WHERE role='customer') AS customers,
              (SELECT COUNT(*) FROM tours) AS tours,
              COUNT(*) AS bookings, COALESCE(SUM(total_amount),0) AS revenue
       FROM bookings WHERE status <> 'cancelled'`);
    const byDestination = await query('SELECT * FROM v_revenue_by_destination ORDER BY revenue DESC');
    // GROUP BY + HAVING + ORDER BY + JOIN: tours that sold at least 2 seats
    const topTours = await query(
      `SELECT t.tour_id, t.title, SUM(b.seats) AS seats_sold, fn_tour_revenue(t.tour_id) AS revenue
       FROM tours t JOIN bookings b ON b.tour_id=t.tour_id AND b.status<>'cancelled'
       GROUP BY t.tour_id, t.title HAVING SUM(b.seats) >= 2 ORDER BY seats_sold DESC LIMIT 5`);
    // Sub-query: tours whose fill-rate is above the average fill-rate
    const hot = await query(
      `SELECT title, ROUND((max_seats-available_seats)/max_seats*100) AS filled_pct FROM tours
       WHERE (max_seats-available_seats)/max_seats > (SELECT AVG((max_seats-available_seats)/max_seats) FROM tours)
       ORDER BY filled_pct DESC`);
    const monthly = await query(
      `SELECT DATE_FORMAT(booking_date,'%Y-%m') AS month, COUNT(*) AS bookings, SUM(total_amount) AS revenue
       FROM bookings WHERE status<>'cancelled' GROUP BY month ORDER BY month`);
    const audit = await query('SELECT * FROM audit_log ORDER BY log_id DESC LIMIT 8');

    let nosql = { topRated: [], tags: [], mostViewed: [] };
    try {
      const db = await mongoDb();
      nosql.topRated = await db.collection('reviews').aggregate([
        { $group: { _id: '$tourId', avg: { $avg: '$rating' }, n: { $sum: 1 } } }, { $sort: { avg: -1 } }, { $limit: 5 }]).toArray();
      nosql.tags = await db.collection('reviews').aggregate([
        { $unwind: '$tags' }, { $group: { _id: '$tags', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]).toArray();
      nosql.mostViewed = await db.collection('activity_logs').aggregate([
        { $match: { action: 'view_tour' } }, { $group: { _id: '$tourId', views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 5 }]).toArray();
    } catch {}
    return json({ totals, byDestination, topTours, hot, monthly, audit, nosql });
  } catch (e) { return dbError(e); }
}
