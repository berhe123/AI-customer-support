import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import { prisma } from '../../shared/database/prisma.js';
import { env, gmailConfigured } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ticketService } from '../tickets/ticket.service.js';
import type { IncomingAttachment } from '../tickets/ticket.service.js';
import { DEMO_CUSTOMER_EMAILS } from '../../shared/demo/demo-data.js';
import { readFile } from '../../shared/storage/file-storage.js';
import { isAllowedFileName, isAllowedMimeType, resolveMimeType } from '../../shared/storage/allowed-mime-types.js';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatGmailAfterDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `after:${year}/${month}/${day}`;
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf-8');
}

function decodeBase64UrlBuffer(data: string): Buffer {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}

function extractDisplayName(raw: string): string {
  const match = raw.match(/^(.+?)\s*<[^>]+>$/);
  return match?.[1]?.replace(/"/g, '').trim() || extractEmailAddress(raw).split('@')[0] || 'Customer';
}

function extractMessageBody(payload?: gmail_v1.Schema$MessagePart | null): string {
  if (!payload) return '';

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data).trim();
  }

  const parts = payload.parts ?? [];
  const plainPart = parts.find((part) => part.mimeType === 'text/plain' && part.body?.data);
  if (plainPart?.body?.data) {
    return decodeBase64Url(plainPart.body.data).trim();
  }

  const htmlPart = parts.find((part) => part.mimeType === 'text/html' && part.body?.data);
  if (htmlPart?.body?.data) {
    return decodeBase64Url(htmlPart.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  for (const part of parts) {
    const nested = extractMessageBody(part);
    if (nested) return nested;
  }

  return '';
}

function isAttachmentPart(part: gmail_v1.Schema$MessagePart): boolean {
  const fileName = part.filename?.trim();
  if (!fileName) return false;

  const mimeType = part.mimeType ?? 'application/octet-stream';
  return isAllowedMimeType(mimeType) || isAllowedFileName(fileName);
}

function collectAttachmentParts(
  payload: gmail_v1.Schema$MessagePart | undefined | null,
  results: gmail_v1.Schema$MessagePart[] = [],
): gmail_v1.Schema$MessagePart[] {
  if (!payload) return results;

  if (isAttachmentPart(payload)) {
    results.push(payload);
  }

  for (const part of payload.parts ?? []) {
    collectAttachmentParts(part, results);
  }

  return results;
}

async function extractAttachments(
  gmail: gmail_v1.Gmail,
  messageId: string,
  payload?: gmail_v1.Schema$MessagePart | null,
): Promise<IncomingAttachment[]> {
  const attachmentParts = collectAttachmentParts(payload);
  const attachments: IncomingAttachment[] = [];

  for (const part of attachmentParts) {
    const fileName = part.filename?.trim();
    if (!fileName) continue;

    let buffer: Buffer | null = null;

    if (part.body?.data) {
      buffer = decodeBase64UrlBuffer(part.body.data);
    } else if (part.body?.attachmentId) {
      const attachmentResponse = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: part.body.attachmentId,
      });
      if (attachmentResponse.data.data) {
        buffer = decodeBase64UrlBuffer(attachmentResponse.data.data);
      }
    }

    if (!buffer || buffer.length === 0) continue;
    if (buffer.length > env.MAX_FILE_SIZE_BYTES) continue;
    if (attachments.length >= env.MAX_FILES_PER_MESSAGE) break;

    const mimeType = resolveMimeType(fileName, part.mimeType ?? 'application/octet-stream');
    if (!isAllowedMimeType(mimeType) && !isAllowedFileName(fileName)) continue;

    attachments.push({ fileName, mimeType, buffer });
  }

  return attachments;
}

function buildMultipartMime(
  headers: string[],
  textContent: string,
  attachments: Array<{ fileName: string; mimeType: string; buffer: Buffer }>,
): string {
  if (attachments.length === 0) {
    return [...headers, 'Content-Type: text/plain; charset=utf-8', '', textContent].join('\r\n');
  }

  const boundary = `boundary_${Date.now()}`;
  const lines = [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    textContent,
  ];

  for (const attachment of attachments) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${attachment.mimeType}; name="${attachment.fileName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.fileName}"`,
      '',
      attachment.buffer.toString('base64'),
    );
  }

  lines.push(`--${boundary}--`);
  return lines.join('\r\n');
}

async function getAuthenticatedClient() {
  const integration = await prisma.gmailIntegration.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  if (!integration) {
    throw new AppError(400, 'Gmail is not connected. Connect your inbox in Settings first.');
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    refresh_token: integration.refreshToken,
    access_token: integration.accessToken ?? undefined,
    expiry_date: integration.tokenExpiry?.getTime(),
  });

  oauth2Client.on('tokens', async (tokens) => {
    if (!tokens.access_token) return;
    await prisma.gmailIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        refreshToken: tokens.refresh_token ?? integration.refreshToken,
      },
    });
  });

  return { oauth2Client, integration };
}

export class GmailService {
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private syncing = false;

  isConfigured() {
    return gmailConfigured;
  }

  getSupportEmail() {
    return env.GMAIL_SUPPORT_EMAIL;
  }

  private assertGmailEnabled() {
    if (env.GMAIL_DEMO_ONLY) {
      throw new AppError(
        403,
        'Gmail is disabled. The app is running in demo-only mode with sample tickets.',
      );
    }
  }

  async getStatus() {
    const integration = await prisma.gmailIntegration.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    return {
      configured: gmailConfigured,
      connected: Boolean(integration),
      emailAddress: integration?.emailAddress ?? env.GMAIL_SUPPORT_EMAIL,
      lastSyncAt: integration?.lastSyncAt?.toISOString() ?? null,
      syncFromDate: (integration?.syncFromDate ?? getStartOfToday()).toISOString(),
      missingSecret: Boolean(env.GOOGLE_CLIENT_ID && !gmailConfigured),
      autoSyncEnabled: env.GMAIL_AUTO_SYNC && !env.GMAIL_DEMO_ONLY,
      syncIntervalSeconds: env.GMAIL_SYNC_INTERVAL_SECONDS,
      demoOnly: env.GMAIL_DEMO_ONLY,
    };
  }

  getAuthUrl(userId: string) {
    this.assertGmailEnabled();
    if (!gmailConfigured) {
      throw new AppError(400, 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
    }

    const oauth2Client = createOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GMAIL_SCOPES,
      state: userId,
      login_hint: env.GMAIL_SUPPORT_EMAIL,
    });
  }

  async handleOAuthCallback(code: string) {
    this.assertGmailEnabled();
    if (!gmailConfigured) {
      throw new AppError(400, 'Google OAuth is not configured');
    }

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new AppError(400, 'Google did not return a refresh token. Remove app access in Google Account settings and try again.');
    }

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailAddress = profile.data.emailAddress ?? env.GMAIL_SUPPORT_EMAIL;

    const syncFromDate = getStartOfToday();

    await prisma.gmailIntegration.deleteMany({});
    await prisma.gmailIntegration.create({
      data: {
        emailAddress,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token ?? null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        syncFromDate,
      },
    });

    await this.cleanupPastImportedTickets();
    this.startAutoSync();

    return emailAddress;
  }

  async disconnect() {
    this.stopAutoSync();
    await prisma.gmailIntegration.deleteMany({});
  }

  async enableDemoOnlyMode() {
    this.stopAutoSync();
    await prisma.processedEmail.deleteMany({});
    await prisma.gmailIntegration.deleteMany({});

    const gmailDeleted = await prisma.ticket.deleteMany({
      where: {
        OR: [
          { gmailThreadId: { not: null } },
          { gmailMessageId: { not: null } },
        ],
      },
    });

    const nonDemoDeleted = await prisma.ticket.deleteMany({
      where: {
        customer: { email: { notIn: [...DEMO_CUSTOMER_EMAILS] } },
      },
    });

    const deletedCustomers = await prisma.customer.deleteMany({
      where: { email: { notIn: [...DEMO_CUSTOMER_EMAILS] } },
    });

    return {
      deletedTickets: gmailDeleted.count + nonDemoDeleted.count,
      deletedCustomers: deletedCustomers.count,
    };
  }

  async cleanupPastImportedTickets() {
    const startOfToday = getStartOfToday();
    const startOfTodayMs = startOfToday.getTime();

    const gmailTickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { gmailThreadId: { not: null } },
          { gmailMessageId: { not: null } },
        ],
      },
      select: {
        id: true,
        customerId: true,
        gmailMessageId: true,
        gmailReceivedAt: true,
      },
    });

    let gmail: gmail_v1.Gmail | null = null;
    try {
      const { oauth2Client } = await getAuthenticatedClient();
      gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    } catch {
      // Gmail not connected — fall back to stored dates only
    }

    const ticketIdsToDelete: string[] = [];

    for (const ticket of gmailTickets) {
      let receivedAt = ticket.gmailReceivedAt;

      if (!receivedAt && ticket.gmailMessageId && gmail) {
        try {
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: ticket.gmailMessageId,
            format: 'metadata',
            metadataHeaders: ['Date'],
          });
          const internalMs = Number(msg.data.internalDate ?? 0);
          if (internalMs > 0) {
            receivedAt = new Date(internalMs);
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { gmailReceivedAt: receivedAt },
            });
          }
        } catch {
          // Message may have been deleted from Gmail — treat as past import
        }
      }

      const receivedMs = receivedAt?.getTime() ?? 0;
      if (receivedMs > 0 && receivedMs < startOfTodayMs) {
        ticketIdsToDelete.push(ticket.id);
      } else if (receivedMs === 0) {
        // No reliable date (legacy import) — remove so only dated today+ emails remain
        ticketIdsToDelete.push(ticket.id);
      }
    }

    const customerIds = [
      ...new Set(
        gmailTickets
          .filter((t) => ticketIdsToDelete.includes(t.id))
          .map((t) => t.customerId),
      ),
    ];

    if (ticketIdsToDelete.length === 0) {
      await prisma.gmailIntegration.updateMany({ data: { syncFromDate: startOfToday } });
      return { deletedTickets: 0, deletedCustomers: 0 };
    }

    await prisma.processedEmail.deleteMany({
      where: {
        OR: [
          { ticketId: { in: ticketIdsToDelete } },
          { ticketId: 'legacy-skip' },
        ],
      },
    });

    const deletedTickets = await prisma.ticket.deleteMany({
      where: { id: { in: ticketIdsToDelete } },
    });

    let deletedCustomers = 0;
    for (const customerId of customerIds) {
      const remaining = await prisma.ticket.count({ where: { customerId } });
      if (remaining === 0) {
        await prisma.customer.delete({ where: { id: customerId } });
        deletedCustomers += 1;
      }
    }

    await prisma.gmailIntegration.updateMany({ data: { syncFromDate: startOfToday } });

    console.log(
      `🧹 Gmail cleanup: removed ${deletedTickets.count} past ticket(s), kept today onward (from ${startOfToday.toISOString()})`,
    );

    return { deletedTickets: deletedTickets.count, deletedCustomers };
  }

  startAutoSync() {
    if (!env.GMAIL_AUTO_SYNC || env.GMAIL_DEMO_ONLY) return;

    this.stopAutoSync();

    const intervalMs = env.GMAIL_SYNC_INTERVAL_SECONDS * 1000;
    console.log(`📬 Gmail auto-sync enabled (every ${env.GMAIL_SYNC_INTERVAL_SECONDS}s)`);

    const runSync = async () => {
      if (this.syncing) return;

      const integration = await prisma.gmailIntegration.findFirst();
      if (!integration) return;

      this.syncing = true;
      try {
        const result = await this.syncInbox();
        if (result.created > 0 || result.updated > 0) {
          console.log(`📬 Gmail sync: ${result.created} new ticket(s), ${result.updated} updated`);
        }
      } catch (err) {
        console.error('Gmail auto-sync error:', err instanceof Error ? err.message : err);
      } finally {
        this.syncing = false;
      }
    };

    void runSync();
    this.syncTimer = setInterval(() => void runSync(), intervalMs);
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async syncInbox() {
    this.assertGmailEnabled();
    const { oauth2Client, integration } = await getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const syncFromDate = integration.syncFromDate ?? getStartOfToday();
    if (!integration.syncFromDate) {
      await prisma.gmailIntegration.update({
        where: { id: integration.id },
        data: { syncFromDate },
      });
    }

    const query = `is:unread in:inbox ${formatGmailAfterDate(syncFromDate)}`;

    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 25,
    });

    const messageIds = listResponse.data.messages ?? [];
    let created = 0;
    let updated = 0;

    for (const item of messageIds) {
      if (!item.id) continue;

      const alreadyProcessed = await prisma.processedEmail.findUnique({
        where: { gmailMessageId: item.id },
      });
      if (alreadyProcessed) continue;

      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: item.id,
        format: 'full',
      });

      const messageDate = Number(fullMessage.data.internalDate ?? 0);
      const receivedAt = new Date(messageDate);
      if (messageDate < syncFromDate.getTime()) {
        await prisma.processedEmail.create({
          data: { gmailMessageId: item.id, ticketId: 'legacy-skip' },
        }).catch(() => undefined);
        continue;
      }

      const payload = fullMessage.data.payload;
      const fromRaw = getHeader(payload?.headers, 'From');
      const subject = getHeader(payload?.headers, 'Subject') || '(No subject)';
      const senderEmail = extractEmailAddress(fromRaw);
      const senderName = extractDisplayName(fromRaw);
      const body = extractMessageBody(payload) || subject;
      const attachments = await extractAttachments(gmail, item.id, payload);
      const threadId = fullMessage.data.threadId ?? item.id;

      if (senderEmail === integration.emailAddress.toLowerCase()) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: item.id,
          requestBody: { removeLabelIds: ['UNREAD'] },
        });
        continue;
      }

      const existingTicket = await prisma.ticket.findUnique({
        where: { gmailThreadId: threadId },
      });

      if (existingTicket) {
        const message = await ticketService.addCustomerMessage(existingTicket.id, body, attachments);
        await prisma.processedEmail.create({
          data: { gmailMessageId: item.id, ticketId: existingTicket.id },
        });
        updated += 1;
        void message;
      } else {
        const ticket = await ticketService.createFromEmail({
          subject,
          message: body,
          customerName: senderName,
          customerEmail: senderEmail,
          gmailThreadId: threadId,
          gmailMessageId: item.id,
          gmailReceivedAt: receivedAt,
          attachments,
        });
        await prisma.processedEmail.create({
          data: { gmailMessageId: item.id, ticketId: ticket.id },
        });
        created += 1;
      }

      await gmail.users.messages.modify({
        userId: 'me',
        id: item.id,
        requestBody: { removeLabelIds: ['UNREAD'] },
      });
    }

    await prisma.gmailIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return { created, updated, scanned: messageIds.length };
  }

  async sendReply(
    ticketId: string,
    content: string,
    _agentName: string,
    attachmentRecords: Array<{ fileName: string; mimeType: string; storageKey: string }> = [],
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { customer: true },
    });

    if (!ticket?.gmailThreadId) return null;

    const { oauth2Client, integration } = await getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const subject = ticket.subject.startsWith('Re:') ? ticket.subject : `Re: ${ticket.subject}`;
    const headers = [
      `To: ${ticket.customer.email}`,
      `From: ${integration.emailAddress}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
    ];

    const attachmentBuffers = await Promise.all(
      attachmentRecords.map(async (record) => ({
        fileName: record.fileName,
        mimeType: record.mimeType,
        buffer: await readFile(record.storageKey),
      })),
    );

    const mime = buildMultipartMime(headers, content, attachmentBuffers);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodeBase64Url(mime),
        threadId: ticket.gmailThreadId,
      },
    });

    return true;
  }
}

export const gmailService = new GmailService();
