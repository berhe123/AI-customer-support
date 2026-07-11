import type { Response } from 'express';
import { authService } from './auth.service.js';
import { asyncHandler } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.userId);
  res.json({ success: true, data: user });
});

export const listAgents = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const agents = await authService.listAgents();
  res.json({ success: true, data: agents });
});
