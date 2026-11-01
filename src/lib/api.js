const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'dxa_token';

export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function handleUnauthorized() {
  tokenStore.clear();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) window.location.href = '/login';
}

/** Returns `data` from { success, data }. Throws Error(message) otherwise. */
export async function api(path, { method = 'GET', body, params, formData, raw } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}${qs(params)}`, { method, headers, body: formData || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and the API URL');
  }

  if (raw) {
    if (!res.ok) {
      if (res.status === 401) handleUnauthorized();
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || 'Download failed');
    }
    return res;
  }

  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/auth/login')) handleUnauthorized();
  if (!res.ok || json.success === false) throw new Error(json.message || 'Something went wrong');
  // Endpoints without a `data` key (e.g. delete employee → { archived, message }) return the whole body
  return json.data !== undefined ? json.data : json;
}

/** Downloads a CSV (or any file) from an authenticated endpoint. */
export async function downloadFile(path, params, fallbackName = 'export.csv') {
  const res = await api(path, { params, raw: true });
  const cd = res.headers.get('Content-Disposition') || '';
  const name = /filename="?([^"]+)"?/.exec(cd)?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
