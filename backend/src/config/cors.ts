import { env } from './env.js';

const configuredOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (configuredOrigins.includes('*')) return true;

  try {
    const host = new URL(origin).hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }

  return false;
}

export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`Origin ${origin} not allowed by CORS`));
}
