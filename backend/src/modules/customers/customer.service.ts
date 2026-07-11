import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { paginate, paginationMeta } from '../../shared/types/api.js';

export class CustomerService {
  async list(query: { page?: number; limit?: number; search?: string }) {
    const { skip, take, page, limit } = paginate(query.page, query.limit);

    const where: Prisma.CustomerWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { tickets: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, meta: paginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedAgent: { select: { id: true, name: true } },
            _count: { select: { messages: true } },
          },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }
}

export const customerService = new CustomerService();
