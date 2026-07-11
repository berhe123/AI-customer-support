import {
  Prisma,
  TicketStatus,
  TicketPriority,
  AttachmentSource,
} from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error.js';
import { paginate, paginationMeta } from '../../shared/types/api.js';
import { sentimentService } from '../ai/sentiment.service.js';
import { aiService } from '../ai/ai.service.js';
import { authService } from '../auth/auth.service.js';
import { saveFile } from '../../shared/storage/file-storage.js';
import type {
  CreateTicketInput,
  UpdateTicketInput,
  TicketQuery,
  AddMessageInput,
  AiReplyLogInput,
  MockEmailInput,
} from './ticket.types.js';
import type { Server as SocketServer } from 'socket.io';
import { gmailService } from '../email/gmail.service.js';

export interface IncomingAttachment {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

const messageInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  attachments: {
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      size: true,
      source: true,
      createdAt: true,
    },
  },
};

const ticketInclude = {
  customer: true,
  assignedAgent: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: messageInclude,
  },
  _count: { select: { messages: true } },
};

function computeHealthScore(
  ticketCount: number,
  negativeCount: number,
  urgentCount: number,
): number {
  let score = 100;
  score -= Math.min(ticketCount * 2, 30);
  score -= negativeCount * 10;
  score -= urgentCount * 15;
  return Math.max(0, Math.min(100, score));
}

export class TicketService {
  private io: SocketServer | null = null;

  setSocket(io: SocketServer) {
    this.io = io;
  }

  private emit(event: string, data: unknown) {
    this.io?.emit(event, data);
  }

  async list(query: TicketQuery) {
    const { skip, take, page, limit } = paginate(query.page, query.limit);

    const where: Prisma.TicketWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.sentiment) where.sentiment = query.sentiment;
    if (query.assignedAgentId) where.assignedAgentId = query.assignedAgentId;
    if (query.customerId) where.customerId = query.customerId;

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
        { customer: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: Prisma.TicketOrderByWithRelationInput = {};
    const sortField = query.sortBy ?? 'createdAt';
    orderBy[sortField] = query.sortOrder ?? 'desc';

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: { select: { id: true, name: true, email: true, healthScore: true } },
          assignedAgent: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, meta: paginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });

    if (!ticket) throw new NotFoundError('Ticket');
    return ticket;
  }

  async create(input: CreateTicketInput) {
    return this.createInternal(input);
  }

  async createFromEmail(
    input: CreateTicketInput & {
      gmailThreadId: string;
      gmailMessageId: string;
      gmailReceivedAt: Date;
      attachments?: IncomingAttachment[];
    },
  ) {
    return this.createInternal(input);
  }

  private async createInternal(
    input: CreateTicketInput & {
      gmailThreadId?: string;
      gmailMessageId?: string;
      gmailReceivedAt?: Date;
      attachments?: IncomingAttachment[];
    },
  ) {
    const sentiment = sentimentService.analyze(`${input.subject} ${input.message}`);

    let customer = await prisma.customer.findUnique({
      where: { email: input.customerEmail },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: input.customerName,
          email: input.customerEmail,
        },
      });
    }

    let assignedAgentId = input.assignedAgentId ?? null;

    if (!assignedAgentId) {
      const agents = await authService.listAgents();
      const suggestedId = aiService.suggestAgent(agents, sentiment.sentiment);
      assignedAgentId = suggestedId;
    }

    const messageContent = this.buildMessageContent(input.message, input.attachments);

    const ticket = await prisma.ticket.create({
      data: {
        subject: input.subject,
        priority: input.priority ?? (sentiment.urgencyBoost ? TicketPriority.HIGH : TicketPriority.MEDIUM),
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score,
        tags: sentiment.tags,
        customerId: customer.id,
        assignedAgentId,
        gmailThreadId: input.gmailThreadId,
        gmailMessageId: input.gmailMessageId,
        gmailReceivedAt: input.gmailReceivedAt,
        messages: {
          create: {
            content: messageContent,
            isAgent: false,
            attachments: input.attachments?.length
              ? {
                  create: await this.prepareAttachmentRecords(input.attachments, AttachmentSource.CUSTOMER),
                }
              : undefined,
          },
        },
      },
      include: ticketInclude,
    });

    await this.updateCustomerHealth(customer.id);
    this.emit('ticket:created', ticket);

    return ticket;
  }

  async update(id: string, input: UpdateTicketInput) {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Ticket');

    const data: Prisma.TicketUpdateInput = { ...input };

    if (input.status === TicketStatus.CLOSED) {
      data.closedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: ticketInclude,
    });

    this.emit('ticket:updated', ticket);
    return ticket;
  }

  async delete(id: string) {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Ticket');

    await prisma.ticket.delete({ where: { id } });
    this.emit('ticket:deleted', { id });
  }

  async addMessage(
    ticketId: string,
    authorId: string,
    input: AddMessageInput,
    files: Express.Multer.File[] = [],
  ) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    const content = (input.content ?? '').trim();
    if (!content && files.length === 0) {
      throw new ValidationError('Message content or at least one attachment is required');
    }

    const incomingAttachments = files.map((file) => ({
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    }));

    const messageContent = this.buildMessageContent(content, incomingAttachments);

    const message = await prisma.message.create({
      data: {
        ticketId,
        authorId,
        content: messageContent,
        isAgent: true,
        isAiGenerated: input.isAiGenerated ?? false,
        attachments: incomingAttachments.length
          ? {
              create: await this.prepareAttachmentRecords(incomingAttachments, AttachmentSource.AGENT),
            }
          : undefined,
      },
      include: messageInclude,
    });

    const updateData: Prisma.TicketUpdateInput = {
      status: ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : undefined,
    };

    if (!ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    this.emit('ticket:message', { ticketId, message });

    try {
      const author = await prisma.user.findUnique({ where: { id: authorId }, select: { name: true } });
      const attachmentRecords = await prisma.attachment.findMany({
        where: { messageId: message.id },
      });
      const emailBody = content || (incomingAttachments.length ? '(See attached file(s))' : messageContent);
      await gmailService.sendReply(
        ticketId,
        emailBody,
        author?.name ?? 'Support Agent',
        attachmentRecords,
      );
    } catch {
      // Gmail send is optional when ticket is not linked to an email thread
    }

    return message;
  }

  async addCustomerMessage(
    ticketId: string,
    content: string,
    attachments: IncomingAttachment[] = [],
  ) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket');

    const messageContent = this.buildMessageContent(content, attachments);

    const message = await prisma.message.create({
      data: {
        ticketId,
        content: messageContent,
        isAgent: false,
        attachments: attachments.length
          ? {
              create: await this.prepareAttachmentRecords(attachments, AttachmentSource.CUSTOMER),
            }
          : undefined,
      },
      include: messageInclude,
    });

    this.emit('ticket:message', { ticketId, message });
    return message;
  }

  async generateAiReply(ticketId: string) {
    const ticket = await this.getById(ticketId);
    const result = await aiService.generateReply(
      ticket.subject,
      ticket.messages.map((m) => ({ content: m.content, isAgent: m.isAgent })),
      ticket.customer.name,
    );
    return result;
  }

  async logAiReply(ticketId: string, agentId: string, input: AiReplyLogInput) {
    return prisma.aiReplyLog.create({
      data: {
        ticketId,
        agentId,
        suggestion: input.suggestion,
        finalReply: input.finalReply,
        action: input.action,
        confidence: input.confidence,
        responseTime: input.responseTime,
      },
    });
  }

  async processMockEmail(input: MockEmailInput, files: Express.Multer.File[] = []) {
    const attachments = files.map((file) => ({
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    }));

    return this.createInternal({
      subject: input.subject,
      message: input.message,
      customerName: input.senderName ?? input.senderEmail.split('@')[0] ?? 'Customer',
      customerEmail: input.senderEmail,
      attachments,
    });
  }

  private buildMessageContent(text: string, attachments?: IncomingAttachment[]): string {
    const trimmed = text.trim();
    if (!attachments?.length) return trimmed || '(No message content)';

    const names = attachments.map((a) => a.fileName).join(', ');
    if (!trimmed) return `Sent attachment(s): ${names}`;
    return `${trimmed}\n\nAttachments: ${names}`;
  }

  private async prepareAttachmentRecords(
    attachments: IncomingAttachment[],
    source: AttachmentSource,
  ) {
    const records = [];

    for (const attachment of attachments) {
      const stored = await saveFile(attachment.buffer, attachment.fileName, attachment.mimeType);
      records.push({
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        size: stored.size,
        storageKey: stored.storageKey,
        source,
      });
    }

    return records;
  }

  private async updateCustomerHealth(customerId: string) {
    const tickets = await prisma.ticket.findMany({
      where: { customerId },
      select: { sentiment: true },
    });

    const negativeCount = tickets.filter(
      (t) => t.sentiment === 'NEGATIVE' || t.sentiment === 'URGENT',
    ).length;
    const urgentCount = tickets.filter((t) => t.sentiment === 'URGENT').length;

    const healthScore = computeHealthScore(tickets.length, negativeCount, urgentCount);

    await prisma.customer.update({
      where: { id: customerId },
      data: { healthScore },
    });
  }
}

export const ticketService = new TicketService();
