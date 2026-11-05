import { getUser, json } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  return json({ user: await getUser() });
}
