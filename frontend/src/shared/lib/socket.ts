import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/shared/config';
import { useNotificationStore } from '@/shared/lib/stores';
import { useQueryClient } from '@tanstack/react-query';
import { ticketKeys } from '@/entities/ticket/api/hooks';

let socket: Socket | null = null;

export function useSocket() {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      // Prefer polling first so Render cold starts / proxies still work; websocket upgrades after.
      socket = io(config.wsUrl, {
        transports: ['polling', 'websocket'],
        path: '/socket.io',
        withCredentials: true,
        reconnectionAttempts: 8,
      });
    }

    const handleTicketCreated = (ticket: { subject: string }) => {
      addNotification('info', `New ticket: ${ticket.subject}`);
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    };

    const handleTicketUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    };

    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:message', () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.details() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    });

    return () => {
      socket?.off('ticket:created', handleTicketCreated);
      socket?.off('ticket:updated', handleTicketUpdated);
    };
  }, [addNotification, queryClient]);
}
