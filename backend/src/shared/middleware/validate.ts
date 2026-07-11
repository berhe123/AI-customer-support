import type { Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors/app-error.js';
import type { AuthenticatedRequest } from './auth.js';

type RequestSource = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, source: RequestSource = 'body') {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      next(new ValidationError(messages.join('; ')));
      return;
    }

    req[source] = result.data as typeof req[typeof source];
    next();
  };
}

export function asyncHandler(
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
