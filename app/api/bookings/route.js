import { query, pool } from '@/lib/db';
import { requireRole, json, dbError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, error } = await requireRole('customer', 'admin');
  if (error) return error;
  try {
    const rows = user.role === 'admin'
      ? await query('SELECT * FROM v_booking_details ORDER BY booking_date DESC')
      : await query('SELECT * FROM v_booking_details WHERE user_id=? ORDER BY booking_date DESC', [user.id]);
    return json(rows);
  } catch (e) { return dbError(e); }
}

export async function POST(req) {
  const { user, error } = await requireRole('customer', 'admin');
  if (error) return error;
  const conn = await pool.getConnection();
  try {
    const { tour_id, seats, method } = await req.json();
    const n = Number(seats);
    if (!Number.isInteger(n) || n < 1 || n > 10) return json({ error: 'Seats must be between 1 and 10' }, 400);
    if (!['card', 'upi', 'netbanking', 'cash'].includes(method)) return json({ error: 'Choose a payment method' }, 400);
    // Stored procedure runs the whole booking as ONE transaction (lock -> insert booking -> insert payment)
    await conn.query('CALL sp_book_tour(?,?,?,?,@bid)', [user.id, Number(tour_id), n, method]);
    const [[row]] = await conn.query('SELECT @bid AS booking_id');
    return json({ booking_id: row.booking_id }, 201);
  } catch (e) { return dbError(e); }
  finally { conn.release(); }
}
