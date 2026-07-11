import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3001/api/email/gmail/callback'),
  GMAIL_SUPPORT_EMAIL: z.string().email().default('berhemit2005@gmail.com'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  GMAIL_AUTO_SYNC: z
    .string()
    .optional()
    .transform((v) => v !== 'false' && v !== '0'),
  GMAIL_DEMO_ONLY: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  GMAIL_SYNC_INTERVAL_SECONDS: z.coerce.number().min(15).max(600).default(30),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().min(1024).default(10 * 1024 * 1024),
  MAX_FILES_PER_MESSAGE: z.coerce.number().min(1).max(10).default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

const PLACEHOLDER_SECRETS = new Set([
  '',
  'your-client-secret',
  'paste-your-client-secret-here',
]);

export const gmailConfigured = Boolean(
  env.GOOGLE_CLIENT_ID
  && env.GOOGLE_CLIENT_SECRET
  && !PLACEHOLDER_SECRETS.has(env.GOOGLE_CLIENT_SECRET.trim())
  && env.GOOGLE_CLIENT_SECRET.length >= 8,
);
