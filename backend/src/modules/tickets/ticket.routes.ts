import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { uploadMiddleware } from '../../shared/middleware/upload.js';
import {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
  addMessageSchema,
  aiReplyLogSchema,
  aiReplySchema,
  mockEmailSchema,
} from './ticket.types.js';
import * as ticketController from './ticket.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(ticketQuerySchema, 'query'), ticketController.listTickets);
router.get('/:id', ticketController.getTicket);
router.post('/', validate(createTicketSchema), ticketController.createTicket);
router.put('/:id', validate(updateTicketSchema), ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);
router.post(
  '/:id/messages',
  uploadMiddleware.array('files'),
  validate(addMessageSchema),
  ticketController.addMessage,
);
router.post('/:id/ai-log', validate(aiReplyLogSchema), ticketController.logAiReply);

export default router;

export const aiRouter = Router();
aiRouter.use(authenticate);
aiRouter.post('/reply', validate(aiReplySchema), ticketController.generateAiReply);

export const mockEmailRouter = Router();
mockEmailRouter.post(
  '/email',
  uploadMiddleware.array('files'),
  validate(mockEmailSchema),
  ticketController.mockEmail,
);
