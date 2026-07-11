import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../../config/env.js';
import { ValidationError } from '../errors/app-error.js';
import { isAllowedFileName, isAllowedMimeType, resolveMimeType } from './allowed-mime-types.js';

export interface StoredFile {
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
}

function getUploadDir(): string {
  return path.resolve(env.UPLOAD_DIR);
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(getUploadDir(), { recursive: true });
}

export function validateFile(fileName: string, mimeType: string, size: number): void {
  if (size <= 0) {
    throw new ValidationError('File is empty');
  }

  if (size > env.MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`File exceeds maximum size of ${Math.round(env.MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB`);
  }

  if (!isAllowedMimeType(mimeType) && !isAllowedFileName(fileName)) {
    throw new ValidationError('File type not allowed. Supported: PDF, Word, Excel, PowerPoint, text, and images.');
  }
}

export async function saveFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<StoredFile> {
  const resolvedMimeType = resolveMimeType(fileName, mimeType);
  validateFile(fileName, resolvedMimeType, buffer.length);
  await ensureUploadDir();

  const ext = path.extname(fileName).toLowerCase();
  const storageKey = `${randomUUID()}${ext}`;
  const filePath = path.join(getUploadDir(), storageKey);

  await fs.writeFile(filePath, buffer);

  return {
    storageKey,
    fileName,
    mimeType: resolvedMimeType,
    size: buffer.length,
  };
}

export async function readFile(storageKey: string): Promise<Buffer> {
  const filePath = path.join(getUploadDir(), storageKey);
  return fs.readFile(filePath);
}

export async function deleteFile(storageKey: string): Promise<void> {
  const filePath = path.join(getUploadDir(), storageKey);
  await fs.unlink(filePath).catch(() => undefined);
}

export function getFilePath(storageKey: string): string {
  return path.join(getUploadDir(), storageKey);
}
