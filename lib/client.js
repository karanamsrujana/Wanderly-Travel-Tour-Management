// tiny fetch wrapper used by all pages
export async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
export const fmtDate = (d) => (d ? String(d).slice(0, 10) : '');
