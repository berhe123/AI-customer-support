import type { Response } from 'express';
import { ticketService } from './ticket.service.js';
import { asyncHandler } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export const listTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await ticketService.list(req.query);
  res.json({ success: true, data: result.tickets, meta: result.meta });
});

export const getTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await ticketService.getById(String(req.params.id));
  res.json({ success: true, data: ticket });
});

export const createTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await ticketService.create(req.body);
  res.status(201).json({ success: true, data: ticket });
});

export const updateTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await ticketService.update(String(req.params.id), req.body);
  res.json({ success: true, data: ticket });
});

export const deleteTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await ticketService.delete(String(req.params.id));
  res.json({ success: true, data: { id: req.params.id } });
});

export const addMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const message = await ticketService.addMessage(
    String(req.params.id),
    req.user!.userId,
    req.body,
    files,
  );
  res.status(201).json({ success: true, data: message });
});

export const generateAiReply = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await ticketService.generateAiReply(req.body.ticketId);
  res.json({ success: true, data: result });
});

export const logAiReply = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const log = await ticketService.logAiReply(String(req.params.id), req.user!.userId, req.body);
  res.status(201).json({ success: true, data: log });
});

export const mockEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const ticket = await ticketService.processMockEmail(req.body, files);
  res.status(201).json({ success: true, data: ticket });
});
