import { prisma } from '../../shared/database/prisma.js';

export class AnalyticsService {
  async getOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      closedTickets,
      ticketsByDay,
      sentimentBreakdown,
      priorityBreakdown,
      aiCopilotStats,
      avgResponseTime,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
      prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { status: 'CLOSED' } }),
      this.getTicketsPerDay(thirtyDaysAgo),
      prisma.ticket.groupBy({
        by: ['sentiment'],
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      this.getAiCopilotStats(),
      this.getAverageResponseTime(),
      prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          assignedAgent: { select: { name: true } },
        },
      }),
    ]);

    const ticketsThisWeek = await prisma.ticket.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const customersAtRisk = await prisma.customer.count({
      where: { healthScore: { lt: 50 } },
    });

    return {
      summary: {
        totalTickets,
        openTickets,
        inProgressTickets,
        closedTickets,
        ticketsThisWeek,
        customersAtRisk,
        avgResponseTimeMinutes: avgResponseTime,
      },
      ticketsByDay,
      sentimentBreakdown: sentimentBreakdown.map((s) => ({
        sentiment: s.sentiment,
        count: s._count.id,
      })),
      priorityBreakdown: priorityBreakdown.map((p) => ({
        priority: p.priority,
        count: p._count.id,
      })),
      aiCopilot: aiCopilotStats,
      recentTickets,
    };
  }

  private async getTicketsPerDay(since: Date) {
    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const dayMap = new Map<string, { date: string; total: number; open: number; closed: number }>();

    for (const ticket of tickets) {
      const date = ticket.createdAt.toISOString().split('T')[0]!;
      const existing = dayMap.get(date) ?? { date, total: 0, open: 0, closed: 0 };
      existing.total++;
      if (ticket.status === 'CLOSED') existing.closed++;
      else existing.open++;
      dayMap.set(date, existing);
    }

    return Array.from(dayMap.values());
  }

  private async getAiCopilotStats() {
    const logs = await prisma.aiReplyLog.findMany({
      select: { action: true, confidence: true, responseTime: true },
    });

    if (logs.length === 0) {
      return {
        totalSuggestions: 0,
        acceptanceRate: 0,
        editRate: 0,
        rejectRate: 0,
        avgConfidence: 0,
        avgResponseTimeMs: 0,
      };
    }

    const accepted = logs.filter((l) => l.action === 'ACCEPTED').length;
    const edited = logs.filter((l) => l.action === 'EDITED').length;
    const rejected = logs.filter((l) => l.action === 'REJECTED').length;
    const total = logs.length;

    return {
      totalSuggestions: total,
      acceptanceRate: Math.round((accepted / total) * 100),
      editRate: Math.round((edited / total) * 100),
      rejectRate: Math.round((rejected / total) * 100),
      avgConfidence: Math.round((logs.reduce((s, l) => s + l.confidence, 0) / total) * 100) / 100,
      avgResponseTimeMs: Math.round(logs.reduce((s, l) => s + l.responseTime, 0) / total),
    };
  }

  private async getAverageResponseTime(): Promise<number> {
    const tickets = await prisma.ticket.findMany({
      where: { firstResponseAt: { not: null } },
      select: { createdAt: true, firstResponseAt: true },
    });

    if (tickets.length === 0) return 0;

    const totalMs = tickets.reduce((sum, t) => {
      return sum + (t.firstResponseAt!.getTime() - t.createdAt.getTime());
    }, 0);

    return Math.round(totalMs / tickets.length / 60000);
  }
}

export const analyticsService = new AnalyticsService();
