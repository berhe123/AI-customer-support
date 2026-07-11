import type { Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { asyncHandler } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export const getOverview = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await analyticsService.getOverview();
  res.json({ success: true, data });
});
