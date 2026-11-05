import { query, pool } from '@/lib/db';
import { requireRole, json, dbError } from '@/lib/auth';

// PATCH body: { action: 'cancel' }  (owner or admin)  |  { action: 'complete' } (admin)
export async function PATCH(req, { params }) {
  const { user, error } = await requireRole('customer', 'admin');
  if (error) return error;
  try {
    const { action } = await req.json();
    const id = Number(params.id);
    if (action === 'cancel') {
      await pool.query('CALL sp_cancel_booking(?,?,?)', [id, user.id, user.role === 'admin']);
      return json({ ok: true });
    }
    if (action === 'complete') {
      if (user.role !== 'admin') return json({ error: 'You do not have permission' }, 403);
      const r = await query("UPDATE bookings SET status='completed' WHERE booking_id=? AND status='confirmed'", [id]);
      return r.affectedRows ? json({ ok: true }) : json({ error: 'Only confirmed bookings can be completed' }, 409);
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (e) { return dbError(e); }
}
