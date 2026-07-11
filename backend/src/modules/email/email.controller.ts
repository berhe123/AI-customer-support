import type { Response } from 'express';
import { asyncHandler } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { gmailService } from './gmail.service.js';
import { env } from '../../config/env.js';

export const getGmailStatus = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const status = await gmailService.getStatus();
  res.json({ success: true, data: status });
});

export const getGmailAuthUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const url = gmailService.getAuthUrl(req.user!.userId);
  res.json({ success: true, data: { url } });
});

export const gmailOAuthCallback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (env.GMAIL_DEMO_ONLY) {
    res.redirect(
      `${env.FRONTEND_URL}/settings?gmail=error&message=${encodeURIComponent('Gmail is disabled in demo-only mode')}`,
    );
    return;
  }
  const code = String(req.query.code ?? '');
  const error = String(req.query.error ?? '');

  if (error) {
    res.redirect(`${env.FRONTEND_URL}/settings?gmail=error&message=${encodeURIComponent(error)}`);
    return;
  }

  if (!code) {
    res.redirect(`${env.FRONTEND_URL}/settings?gmail=error&message=missing_code`);
    return;
  }

  try {
    const emailAddress = await gmailService.handleOAuthCallback(code);
    res.redirect(`${env.FRONTEND_URL}/settings?gmail=connected&email=${encodeURIComponent(emailAddress)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'oauth_failed';
    res.redirect(`${env.FRONTEND_URL}/settings?gmail=error&message=${encodeURIComponent(message)}`);
  }
});

export const syncGmailInbox = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const result = await gmailService.syncInbox();
  res.json({ success: true, data: result });
});

export const disconnectGmail = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  await gmailService.disconnect();
  res.json({ success: true, data: { disconnected: true } });
});

export const cleanupPastGmail = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const result = await gmailService.cleanupPastImportedTickets();
  res.json({ success: true, data: result });
});

export const getGmailSetupGuide = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      supportEmail: env.GMAIL_SUPPORT_EMAIL,
      redirectUri: env.GOOGLE_REDIRECT_URI,
      configured: gmailService.isConfigured(),
      steps: [
        'Go to https://console.cloud.google.com and create a project (e.g. SupportAI).',
        'Open APIs & Services → Library → search Gmail API → Enable.',
        'Open OAuth consent screen → External → add app name and your email as test user.',
        'Open Credentials → Create credentials → OAuth client ID → Web application.',
        `Add authorized redirect URI: ${env.GOOGLE_REDIRECT_URI}`,
        'Copy Client ID and Client Secret into backend/.env as GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        'Restart the backend, then click Connect Gmail in Settings.',
      ],
    },
  });
});
