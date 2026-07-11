import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(authenticate);
router.get('/overview', analyticsController.getOverview);

export default router;
