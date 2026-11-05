import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { signToken, json, dbError, COOKIE } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const rows = await query('SELECT user_id,name,role,password_hash FROM users WHERE email=? AND is_active=TRUE', [(email || '').toLowerCase()]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return json({ error: 'Incorrect email or password' }, 401);
    cookies().set(COOKIE, await signToken(u), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800 });
    return json({ user: { id: u.user_id, name: u.name, role: u.role } });
  } catch (e) {
    return dbError(e);
  }
}
