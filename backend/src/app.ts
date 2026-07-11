import express from 'express';
import cors from 'cors';
import emailRoutes from './modules/email/email.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import ticketRoutes, { aiRouter, mockEmailRouter } from './modules/tickets/ticket.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import attachmentRoutes from './modules/attachments/attachment.routes.js';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/ai', aiRouter);
  app.use('/api/mock', mockEmailRouter);
  app.use('/api/attachments', attachmentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
