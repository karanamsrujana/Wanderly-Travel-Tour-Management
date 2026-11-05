import { query } from '@/lib/db';
import { requireRole, json, dbError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return json(await query('SELECT * FROM destinations ORDER BY name'));
  } catch (e) { return dbError(e); }
}

export async function POST(req) {
  const { error } = await requireRole('admin');
  if (error) return error;
  try {
    const b = await req.json();
    if (!b.name?.trim() || !b.country?.trim()) return json({ error: 'Name and country are required' }, 400);
    const r = await query(
      'INSERT INTO destinations (name,country,region,description,best_season) VALUES (?,?,?,?,?)',
      [b.name.trim(), b.country.trim(), b.region || null, b.description || null, b.best_season || null]);
    return json({ destination_id: r.insertId }, 201);
  } catch (e) { return dbError(e); }
}
