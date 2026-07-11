import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { signToken } from '../../shared/middleware/auth.js';
import type { RegisterInput, LoginInput } from './auth.types.js';

const SALT_ROUNDS = 12;

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role ?? Role.AGENT,
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return { user: sanitizeUser(user), token };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return { user: sanitizeUser(user), token };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }
    return sanitizeUser(user);
  }

  async listAgents() {
    const agents = await prisma.user.findMany({
      where: { isActive: true, role: { in: [Role.AGENT, Role.ADMIN] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        _count: { select: { assignedTickets: { where: { status: { not: 'CLOSED' } } } } },
      },
      orderBy: { name: 'asc' },
    });

    return agents.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      avatarUrl: a.avatarUrl,
      openTicketCount: a._count.assignedTickets,
    }));
  }
}

export const authService = new AuthService();
