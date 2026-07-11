import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import * as attachmentController from './attachment.controller.js';

const router = Router();

router.use(authenticate);
router.get('/:id/download', attachmentController.downloadAttachment);

export default router;
