import {
  getMockStudentImageUrl,
  getMockSubmissions,
  MOCK_ADMIN_TOKEN,
} from './mockAdminData';

const DEFAULT_WRITE_API_BASE =
  typeof window === 'undefined'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.DEV
      ? `http://${window.location.hostname}:8000`
      : window.location.origin;

export const API_BASE = import.meta.env.VITE_WRITE_API_URL || DEFAULT_WRITE_API_BASE;
const TOKEN_STORAGE_KEY = 'barcode_admin_token';

export const USE_MOCK_ADMIN =
  import.meta.env.VITE_USE_MOCK_ADMIN === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_ADMIN !== 'false');

export function isMockMode() {
  return USE_MOCK_ADMIN;
}

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
}

export function setAuthToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getAuthHeaders(extra = {}) {
  const token = getAuthToken();
  if (!token) return { ...extra };
  return {
    ...extra,
    Authorization: `Bearer ${token}`,
  };
}

export async function loginAdmin({ username, password }) {
  if (USE_MOCK_ADMIN) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (!String(username || '').trim() || !String(password || '').trim()) {
      throw new Error('Sai tên đăng nhập hoặc mật khẩu');
    }
    setAuthToken(MOCK_ADMIN_TOKEN);
    return {
      success: true,
      token: MOCK_ADMIN_TOKEN,
      username: String(username).trim(),
      mock: true,
    };
  }

  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ username, password }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      payload?.detail === 'invalid_credentials'
        ? 'Sai tên đăng nhập hoặc mật khẩu'
        : `Login API: ${res.status}`
    );
  }

  setAuthToken(payload.token || '');
  return payload;
}

export async function logoutAdmin() {
  if (USE_MOCK_ADMIN) {
    setAuthToken('');
    return;
  }

  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
    } catch {
      // ignore network errors on logout
    }
  }
  setAuthToken('');
}

export async function verifyAdminSession() {
  if (USE_MOCK_ADMIN) {
    return getAuthToken() === MOCK_ADMIN_TOKEN;
  }

  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/api/admin/me`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (res.status === 401) {
      setAuthToken('');
      return false;
    }
    return res.ok;
  } catch {
    return false;
  }
}

export function getStudentImageUrl(studentCode) {
  const code = String(studentCode || '').trim();
  if (!code) return '';

  if (USE_MOCK_ADMIN) {
    return getMockStudentImageUrl(code);
  }

  const url = new URL(`${API_BASE}/api/admin/images/${encodeURIComponent(code)}`);
  const token = getAuthToken();
  if (token) {
    url.searchParams.set('access_token', token);
  }
  return url.toString();
}

export async function fetchAdminSubmissions({ signal } = {}) {
  if (USE_MOCK_ADMIN) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    return getMockSubmissions();
  }

  const res = await fetch(`${API_BASE}/api/admin/submissions`, {
    cache: 'no-store',
    signal,
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    setAuthToken('');
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  if (!res.ok) {
    throw new Error(`Submissions API: ${res.status}`);
  }
  const payload = await res.json();
  const submissions = Array.isArray(payload?.submissions) ? payload.submissions : [];
  return {
    success: payload?.success !== false,
    submissions,
    total: Number.parseInt(payload?.total ?? '0', 10) || submissions.length,
  };
}
