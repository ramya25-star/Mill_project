// Talks to the Console API (/api/platform). Uses its own token, separate from
// the Mill Mate app's sign-in.
const TOKEN_KEY = 'mm_console_token';

export const apiBase = () => (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const getToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
export const setToken = (token) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* storage blocked */ }
};

let onExpired = null;
export const onSessionExpired = (fn) => { onExpired = fn; };

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${apiBase()}/platform${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('Could not reach the server. Check the internet connection.');
  }
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/setup-2fa')) {
    setToken('');
    if (onExpired) onExpired(json?.error);
  }
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json;
}

// Downloads a file that needs the Console token (company backup).
export async function download(path, filename) {
  const res = await fetch(`${apiBase()}/platform${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) {
    let msg = `Download failed (${res.status})`;
    try { msg = (await res.json()).error || msg; } catch { /* not JSON */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
