import type { Response } from 'express';
import { prisma } from '../../shared/database/prisma.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { asyncHandler } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { readFile } from '../../shared/storage/file-storage.js';

export const downloadAttachment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: String(req.params.id) },
    include: {
      message: { select: { ticketId: true } },
    },
  });

  if (!attachment) throw new NotFoundError('Attachment');

  const buffer = await readFile(attachment.storageKey);

  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
  );
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
});
