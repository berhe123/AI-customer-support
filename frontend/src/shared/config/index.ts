const API_URL = import.meta.env.VITE_API_URL || '/api';
const WS_URL = import.meta.env.VITE_WS_URL?.trim();

export const config = {
  apiUrl: API_URL,
  wsUrl: WS_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'),
} as const;
