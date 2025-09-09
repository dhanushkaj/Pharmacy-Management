// Simple wrapper around fetch that attaches the JWT and base URL.

const BASE = process.env.REACT_APP_API_BASE || ''; // e.g. http://localhost:8080 or '' if proxying

export async function api(path, { method = 'GET', body, token, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Try to parse JSON; if not JSON, return text
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return data;
}
