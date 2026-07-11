import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, customersApi, analyticsApi, authApi, aiApi } from '@/shared/api';
import type { TicketFilters, TicketStatus, TicketPriority } from '@/shared/types';

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: async () => {
      const res = await ticketsApi.list(filters);
      return { tickets: res.data.data ?? [], meta: res.data.meta };
    },
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      const res = await ticketsApi.getById(id);
      return res.data.data!;
    },
    enabled: !!id,
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ status: TicketStatus; priority: TicketPriority; assignedAgentId: string | null }> }) =>
      ticketsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAddMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      content,
      isAiGenerated,
      files,
    }: {
      ticketId: string;
      content: string;
      isAiGenerated?: boolean;
      files?: File[];
    }) => ticketsApi.addMessage(ticketId, content, isAiGenerated, files),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useCustomers(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async () => {
      const res = await customersApi.list(params);
      return { customers: res.data.data ?? [], meta: res.data.meta };
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const res = await customersApi.getById(id);
      return res.data.data!;
    },
    enabled: !!id,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const res = await analyticsApi.getOverview();
      return res.data.data!;
    },
    refetchInterval: 30000,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await authApi.listAgents();
      return res.data.data ?? [];
    },
  });
}

export function useGenerateAiReply() {
  return useMutation({
    mutationFn: (ticketId: string) => aiApi.generateReply(ticketId),
  });
}

export function useLogAiReply() {
  return useMutation({
    mutationFn: ({
      ticketId,
      ...data
    }: {
      ticketId: string;
      suggestion: string;
      finalReply?: string;
      action: 'ACCEPTED' | 'EDITED' | 'REJECTED';
      confidence: number;
      responseTime: number;
    }) => ticketsApi.logAiReply(ticketId, data),
  });
}
