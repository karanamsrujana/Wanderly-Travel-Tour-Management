import { query } from '@/lib/db';
import { requireRole, json, dbError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole('admin');
  if (error) return error;
  try {
    return json(await query('SELECT guide_id,name,languages,experience_years,rating FROM guides ORDER BY name'));
  } catch (e) { return dbError(e); }
}
