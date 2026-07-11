import multer from 'multer';
import { env } from '../../config/env.js';
import { isAllowedFileName, isAllowedMimeType, resolveMimeType } from '../storage/allowed-mime-types.js';

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
    files: env.MAX_FILES_PER_MESSAGE,
  },
  fileFilter: (_req, file, cb) => {
    const mimeType = resolveMimeType(file.originalname, file.mimetype);
    if (isAllowedMimeType(mimeType) || isAllowedFileName(file.originalname)) {
      cb(null, true);
      return;
    }

    cb(new Error('File type not allowed. Supported: PDF, Word, Excel, PowerPoint, text, and images.'));
  },
});
