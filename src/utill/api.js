// Simple wrapper around fetch that attaches cookies and base URL.

const BASE = process.env.REACT_APP_API_BASE || ''; // e.g. http://localhost:8080 or '' if proxying

// Event for handling unauthorized responses (401)
export const onUnauthorized = () => {
  // Clear local auth data
  localStorage.removeItem('roles');
  localStorage.removeItem('username');
  localStorage.removeItem('lastActivity');
  localStorage.removeItem('isAuthenticated');
  
  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export async function api(path, { method = 'GET', body, token, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',  // IMPORTANT: Send cookies with every request (including HTTP-only token cookie)
    headers: {
      'Content-Type': 'application/json',
      // Token parameter is IGNORED - it's in HTTP-only cookie
      // Only send Authorization header if explicitly provided (not used for token cookie)
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    console.warn('Unauthorized (401) - Token expired or invalid, redirecting to login...');
    onUnauthorized();
    throw new Error('Session expired. Please login again.');
  }

  // Handle 403 Forbidden - insufficient permissions
  if (res.status === 403) {
    throw new Error('Access denied. You do not have permission to perform this action.');
  }

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

// Call backend logout endpoint to clear HTTP-only cookie
export async function apiLogout() {
  try {
    await fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  // Clear local storage regardless
  localStorage.removeItem('roles');
  localStorage.removeItem('username');
  localStorage.removeItem('lastActivity');
  localStorage.removeItem('isAuthenticated');
}

// Validate token with backend
export async function apiValidateToken() {
  try {
    const res = await fetch(`${BASE}/api/auth/validate`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      return await res.json();
    }
    return { valid: false };
  } catch (error) {
    console.error('Token validation failed:', error);
    return { valid: false };
  }
}

// Refresh token (extends session)
export async function apiRefreshToken() {
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.ok;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}
