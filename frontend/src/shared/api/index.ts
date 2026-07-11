import { apiClient } from '@/shared/api/client';
import { config } from '../config';
import type {
  User,
  Ticket,
  Customer,
  Agent,
  AiReplyResult,
  AnalyticsOverview,
  TicketFilters,
  ApiResponse,
  PaginationMeta,
} from '@/shared/types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),

  getProfile: () => apiClient.get<ApiResponse<User>>('/auth/me'),

  listAgents: () => apiClient.get<ApiResponse<Agent[]>>('/auth/agents'),
};

export const ticketsApi = {
  list: (filters: TicketFilters = {}) =>
    apiClient.get<ApiResponse<Ticket[]>>('/tickets', { params: filters }),

  getById: (id: string) => apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`),

  create: (data: {
    subject: string;
    message: string;
    customerName: string;
    customerEmail: string;
    priority?: string;
    assignedAgentId?: string;
  }) => apiClient.post<ApiResponse<Ticket>>('/tickets', data),

  update: (id: string, data: Partial<Ticket>) =>
    apiClient.put<ApiResponse<Ticket>>(`/tickets/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<{ id: string }>>(`/tickets/${id}`),

  addMessage: (id: string, content: string, isAiGenerated = false, files: File[] = []) => {
    if (files.length === 0) {
      return apiClient.post<ApiResponse<unknown>>(`/tickets/${id}/messages`, { content, isAiGenerated });
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('isAiGenerated', String(isAiGenerated));
    for (const file of files) {
      formData.append('files', file);
    }

    return apiClient.post<ApiResponse<unknown>>(`/tickets/${id}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  logAiReply: (
    id: string,
    data: {
      suggestion: string;
      finalReply?: string;
      action: 'ACCEPTED' | 'EDITED' | 'REJECTED';
      confidence: number;
      responseTime: number;
    },
  ) => apiClient.post(`/tickets/${id}/ai-log`, data),
};

export const customersApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient.get<ApiResponse<Customer[]>>('/customers', { params }),

  getById: (id: string) => apiClient.get<ApiResponse<Customer>>(`/customers/${id}`),
};

export const aiApi = {
  generateReply: (ticketId: string) =>
    apiClient.post<ApiResponse<AiReplyResult>>('/ai/reply', { ticketId }),
};

export const analyticsApi = {
  getOverview: () => apiClient.get<ApiResponse<AnalyticsOverview>>('/analytics/overview'),
};

export const mockEmailApi = {
  send: (data: { senderEmail: string; senderName?: string; subject: string; message: string }) =>
    apiClient.post<ApiResponse<Ticket>>('/mock/email', data),
};

export interface GmailStatus {
  configured: boolean;
  connected: boolean;
  emailAddress: string;
  lastSyncAt: string | null;
  missingSecret?: boolean;
  autoSyncEnabled?: boolean;
  syncIntervalSeconds?: number;
  demoOnly?: boolean;
}

export interface GmailSetupGuide {
  supportEmail: string;
  redirectUri: string;
  configured: boolean;
  steps: string[];
}

export const emailApi = {
  getStatus: () => apiClient.get<ApiResponse<GmailStatus>>('/email/gmail/status'),
  getSetupGuide: () => apiClient.get<ApiResponse<GmailSetupGuide>>('/email/gmail/setup'),
  getAuthUrl: () => apiClient.get<ApiResponse<{ url: string }>>('/email/gmail/auth-url'),
  syncInbox: () => apiClient.post<ApiResponse<{ created: number; updated: number; scanned: number }>>('/email/gmail/sync'),
  disconnect: () => apiClient.post<ApiResponse<{ disconnected: boolean }>>('/email/gmail/disconnect'),
  cleanupPast: () => apiClient.post<ApiResponse<{ deletedTickets: number; deletedCustomers: number }>>('/email/gmail/cleanup-past'),
};

export const attachmentsApi = {
  getDownloadUrl: (id: string) => `${config.apiUrl}/attachments/${id}/download`,

  download: async (id: string, fileName: string) => {
    const response = await apiClient.get(`/attachments/${id}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export type { PaginationMeta };
