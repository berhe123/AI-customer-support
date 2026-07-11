import { z } from 'zod';
import { TicketStatus, TicketPriority } from '@prisma/client';

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid customer email'),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedAgentId: z.string().optional(),
});

export const updateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedAgentId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'URGENT']).optional(),
  assignedAgentId: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const addMessageSchema = z.object({
  content: z.string().optional(),
  isAiGenerated: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

export const aiReplyLogSchema = z.object({
  suggestion: z.string(),
  finalReply: z.string().optional(),
  action: z.enum(['ACCEPTED', 'EDITED', 'REJECTED']),
  confidence: z.number().min(0).max(1),
  responseTime: z.number().int().positive(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type AiReplyLogInput = z.infer<typeof aiReplyLogSchema>;

export const mockEmailSchema = z.object({
  senderEmail: z.string().email(),
  senderName: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export type MockEmailInput = z.infer<typeof mockEmailSchema>;

export const aiReplySchema = z.object({
  ticketId: z.string(),
});

export type AiReplyInput = z.infer<typeof aiReplySchema>;
