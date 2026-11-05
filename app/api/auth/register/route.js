import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { signToken, json, dbError, COOKIE } from '@/lib/auth';

export async function POST(req) {
  try {
    const { name, email, password, phone } = await req.json();
    if (!name?.trim() || name.length > 100) return json({ error: 'Name is required' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return json({ error: 'Enter a valid email' }, 400);
    if (!password || password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
    if (phone && !/^[0-9+ -]{7,15}$/.test(phone)) return json({ error: 'Enter a valid phone number' }, 400);

    const hash = await bcrypt.hash(password, 10);
    // role is ALWAYS customer on public sign-up; admins are created by seed/DB only
    const r = await query(
      "INSERT INTO users (name,email,password_hash,phone,role) VALUES (?,?,?,?, 'customer')",
      [name.trim(), email.toLowerCase(), hash, phone || null]);
    const user = { user_id: r.insertId, name: name.trim(), role: 'customer' };
    cookies().set(COOKIE, await signToken(user), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800 });
    return json({ user: { id: user.user_id, name: user.name, role: user.role } }, 201);
  } catch (e) {
    return dbError(e);
  }
}
