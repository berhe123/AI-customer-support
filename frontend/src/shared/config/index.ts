function normalizeApiUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim().replace(/\/$/, '');
  if (!value) return '/api';
  if (value.endsWith('/api')) return value;
  // Users often set https://xxx.onrender.com without /api — fix that.
  if (/^https?:\/\//i.test(value)) return `${value}/api`;
  return value;
}

function deriveWsUrl(apiUrl: string, explicit?: string): string {
  const ws = explicit?.trim().replace(/\/$/, '');
  if (ws) return ws;

  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  // Local Vite proxy: talk to the real backend for sockets.
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }

  // Never fall back to the Vercel page origin — Socket.IO must hit Render.
  return 'http://localhost:3001';
}

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);
const WS_URL = deriveWsUrl(API_URL, import.meta.env.VITE_WS_URL);

export const config = {
  apiUrl: API_URL,
  wsUrl: WS_URL,
} as const;
