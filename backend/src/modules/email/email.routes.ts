import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth.js';
import * as emailController from './email.controller.js';

const router = Router();

router.get('/gmail/callback', emailController.gmailOAuthCallback);

router.use(authenticate);

router.get('/gmail/status', emailController.getGmailStatus);
router.get('/gmail/setup', emailController.getGmailSetupGuide);
router.get('/gmail/auth-url', authorize('ADMIN'), emailController.getGmailAuthUrl);
router.post('/gmail/sync', emailController.syncGmailInbox);
router.post('/gmail/cleanup-past', authorize('ADMIN'), emailController.cleanupPastGmail);
router.post('/gmail/disconnect', authorize('ADMIN'), emailController.disconnectGmail);

export default router;
