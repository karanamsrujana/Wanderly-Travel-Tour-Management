import { cookies } from 'next/headers';
import { json, COOKIE } from '@/lib/auth';

export async function POST() {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return json({ ok: true });
}
