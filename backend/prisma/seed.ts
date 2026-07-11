import { PrismaClient, Role, TicketStatus, TicketPriority, Sentiment, AttachmentSource } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveFile, ensureUploadDir } from '../src/shared/storage/file-storage.js';

const prisma = new PrismaClient();
const seedDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aisupport.com' },
    update: {},
    create: {
      email: 'admin@aisupport.com',
      passwordHash,
      name: 'Sarah Admin',
      role: Role.ADMIN,
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@aisupport.com' },
    update: {},
    create: {
      email: 'agent1@aisupport.com',
      passwordHash,
      name: 'Alex Morgan',
      role: Role.AGENT,
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@aisupport.com' },
    update: {},
    create: {
      email: 'agent2@aisupport.com',
      passwordHash,
      name: 'Jordan Lee',
      role: Role.AGENT,
    },
  });

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'john.doe@acmecorp.com' },
      update: {},
      create: { name: 'John Doe', email: 'john.doe@acmecorp.com', company: 'Acme Corp', healthScore: 85 },
    }),
    prisma.customer.upsert({
      where: { email: 'jane.smith@techstart.io' },
      update: {},
      create: { name: 'Jane Smith', email: 'jane.smith@techstart.io', company: 'TechStart', healthScore: 45 },
    }),
    prisma.customer.upsert({
      where: { email: 'mike.wilson@globalnet.com' },
      update: {},
      create: { name: 'Mike Wilson', email: 'mike.wilson@globalnet.com', company: 'GlobalNet', healthScore: 72 },
    }),
    prisma.customer.upsert({
      where: { email: 'emma.davis@cloudify.dev' },
      update: {},
      create: { name: 'Emma Davis', email: 'emma.davis@cloudify.dev', company: 'Cloudify', healthScore: 95 },
    }),
    prisma.customer.upsert({
      where: { email: 'david.brown@enterprise.co' },
      update: {},
      create: { name: 'David Brown', email: 'david.brown@enterprise.co', company: 'Enterprise Co', healthScore: 30 },
    }),
  ]);

  const ticketData = [
    {
      subject: 'URGENT: Production server down!',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      sentiment: Sentiment.URGENT,
      sentimentScore: -0.8,
      tags: ['urgent', 'technical-issue'],
      customerId: customers[1]!.id,
      assignedAgentId: agent1.id,
      message: 'Our production server has been down for 2 hours!!! This is CRITICAL - we are losing revenue every minute. Need immediate help!',
    },
    {
      subject: 'Billing discrepancy on latest invoice',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.MEDIUM,
      sentiment: Sentiment.NEGATIVE,
      sentimentScore: -0.4,
      tags: ['billing', 'negative-tone'],
      customerId: customers[0]!.id,
      assignedAgentId: agent2.id,
      message: 'I noticed a charge of $499 on my latest invoice but our plan should be $299. This is very frustrating. Please fix this immediately.',
    },
    {
      subject: 'Feature request: Dark mode',
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      sentiment: Sentiment.POSITIVE,
      sentimentScore: 0.5,
      tags: ['positive-tone', 'upsell-opportunity'],
      customerId: customers[3]!.id,
      assignedAgentId: agent1.id,
      message: 'Love your product! Would it be possible to add a dark mode? Also interested in upgrading to the enterprise plan.',
    },
    {
      subject: 'Cannot login to dashboard',
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      sentiment: Sentiment.NEUTRAL,
      sentimentScore: -0.1,
      tags: ['technical-issue'],
      customerId: customers[2]!.id,
      assignedAgentId: agent2.id,
      message: 'I keep getting an error when trying to login. Error code: AUTH_401. I tried resetting my password but same issue.',
    },
    {
      subject: 'Considering switching to competitor',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      sentiment: Sentiment.URGENT,
      sentimentScore: -0.7,
      tags: ['churn-risk', 'negative-tone', 'urgent'],
      customerId: customers[4]!.id,
      assignedAgentId: agent1.id,
      message: 'We have been evaluating CompetitorX and their pricing is significantly better. Unless you can match their offer, we will be switching at renewal.',
    },
    {
      subject: 'Thank you for excellent support!',
      status: TicketStatus.CLOSED,
      priority: TicketPriority.LOW,
      sentiment: Sentiment.POSITIVE,
      sentimentScore: 0.8,
      tags: ['positive-tone'],
      customerId: customers[3]!.id,
      assignedAgentId: agent2.id,
      message: 'Just wanted to say thank you for the amazing help yesterday. Alex was incredibly helpful and resolved my issue quickly!',
    },
    {
      subject: 'API rate limiting issues',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      sentiment: Sentiment.NEGATIVE,
      sentimentScore: -0.3,
      tags: ['technical-issue'],
      customerId: customers[0]!.id,
      assignedAgentId: agent1.id,
      message: 'We are hitting rate limits on the API even though we are well within our plan limits. This is blocking our integration deployment.',
    },
    {
      subject: 'Question about SSO integration',
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      sentiment: Sentiment.NEUTRAL,
      sentimentScore: 0.1,
      tags: [],
      customerId: customers[2]!.id,
      assignedAgentId: null,
      message: 'Hi, we would like to set up SSO with Okta. Can you provide documentation on how to configure this?',
    },
  ];

  for (const data of ticketData) {
    const { message, ...ticketFields } = data;
    const existing = await prisma.ticket.findFirst({
      where: { subject: data.subject },
    });

    if (!existing) {
      await prisma.ticket.create({
        data: {
          ...ticketFields,
          messages: { create: { content: message, isAgent: false } },
        },
      });
    }
  }

  const billingTicket = await prisma.ticket.findFirst({
    where: { subject: 'Billing discrepancy on latest invoice' },
    include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
  });

  const billingMessage = billingTicket?.messages[0];
  if (billingMessage) {
    const existingAttachment = await prisma.attachment.findFirst({
      where: { messageId: billingMessage.id },
    });

    if (!existingAttachment) {
      const assetPath = path.join(seedDir, 'seed-assets', 'invoice-dispute.pdf');
      const buffer = await fs.readFile(assetPath);
      await ensureUploadDir();
      const stored = await saveFile(buffer, 'invoice-dispute.pdf', 'application/pdf');
      await prisma.attachment.create({
        data: {
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          size: stored.size,
          storageKey: stored.storageKey,
          source: AttachmentSource.CUSTOMER,
          messageId: billingMessage.id,
        },
      });
      await prisma.message.update({
        where: { id: billingMessage.id },
        data: {
          content: `${billingMessage.content}\n\nAttachments: invoice-dispute.pdf`,
        },
      });
    }
  }

  console.log('✅ Seed completed!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin: admin@aisupport.com / password123');
  console.log('  Agent: agent1@aisupport.com / password123');
  console.log('  Agent: agent2@aisupport.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
