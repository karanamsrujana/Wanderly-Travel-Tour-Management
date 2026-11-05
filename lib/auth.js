import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);
export const COOKIE = 'wanderly_token';

export async function signToken(user) {
  return new SignJWT({ id: user.user_id, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret());
}

// Returns {id, name, role} or null
export async function getUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.id, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });

// Role guard. Usage: const { user, error } = await requireRole('admin');
export async function requireRole(...roles) {
  const user = await getUser();
  if (!user) return { error: json({ error: 'Please log in first' }, 401) };
  if (roles.length && !roles.includes(user.role)) return { error: json({ error: 'You do not have permission' }, 403) };
  return { user };
}

// Turn MySQL errors (trigger SIGNALs / CHECK / FK violations) into friendly messages
export function dbError(e) {
  console.error(e);
  if (e.sqlState === '45000') return json({ error: e.sqlMessage }, 409);
  if (e.code === 'ER_DUP_ENTRY') return json({ error: 'That value already exists' }, 409);
  if (e.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return json({ error: 'Value rejected by a database CHECK constraint' }, 400);
  if (e.code === 'ER_ROW_IS_REFERENCED_2') return json({ error: 'Cannot delete: other records depend on this' }, 409);
  if (e.code === 'ER_NO_REFERENCED_ROW_2') return json({ error: 'Referenced record does not exist' }, 400);
  return json({ error: 'Server error' }, 500);
}
