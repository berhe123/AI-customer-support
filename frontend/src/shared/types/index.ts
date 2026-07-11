export type Role = 'ADMIN' | 'AGENT';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT';
export type AiReplyAction = 'ACCEPTED' | 'EDITED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  healthScore: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tickets: number };
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  source: 'CUSTOMER' | 'AGENT';
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  isAgent: boolean;
  isAiGenerated: boolean;
  createdAt: string;
  author?: { id: string; name: string; avatarUrl: string | null } | null;
  attachments?: Attachment[];
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  sentiment: Sentiment;
  sentimentScore: number;
  tags: string[];
  firstResponseAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  assignedAgentId: string | null;
  customer: Pick<Customer, 'id' | 'name' | 'email' | 'healthScore'>;
  assignedAgent?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  messages?: Message[];
  _count?: { messages: number };
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  openTicketCount: number;
}

export interface AiReplyResult {
  suggestion: string;
  confidence: number;
  tone: string;
  reasoning: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: { message: string; code?: string };
}

export interface AnalyticsOverview {
  summary: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
    ticketsThisWeek: number;
    customersAtRisk: number;
    avgResponseTimeMinutes: number;
  };
  ticketsByDay: Array<{ date: string; total: number; open: number; closed: number }>;
  sentimentBreakdown: Array<{ sentiment: Sentiment; count: number }>;
  priorityBreakdown: Array<{ priority: TicketPriority; count: number }>;
  aiCopilot: {
    totalSuggestions: number;
    acceptanceRate: number;
    editRate: number;
    rejectRate: number;
    avgConfidence: number;
    avgResponseTimeMs: number;
  };
  recentTickets: Ticket[];
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  sentiment?: Sentiment;
  assignedAgentId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
