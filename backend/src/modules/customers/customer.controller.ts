import type { Response } from 'express';
import { customerService } from './customer.service.js';
import { asyncHandler } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export const listCustomers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await customerService.list({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search as string | undefined,
  });
  res.json({ success: true, data: result.customers, meta: result.meta });
});

export const getCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customer = await customerService.getById(String(req.params.id));
  res.json({ success: true, data: customer });
});
