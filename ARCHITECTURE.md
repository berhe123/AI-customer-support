# SupportAI Architecture Document

## System Overview

SupportAI is a modular monolith backend + FSD frontend SaaS application for AI-powered customer support.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React + Vite + MUI + React Query + Zustand + Socket.io-client │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API + WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Modular Monolith)                     │
│  Express + TypeScript + JWT + Socket.io                           │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────┐ ┌───────────┐     │
│  │  Auth   │ │ Tickets │ │Customers │ │ AI │ │ Analytics │     │
│  └─────────┘ └─────────┘ └──────────┘ └────┘ └───────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────────┐
│                     PostgreSQL Database                          │
│  users · customers · tickets · messages · ai_reply_logs         │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend — Feature-Sliced Design (FSD)

FSD organizes code by **business responsibility** and **dependency direction** (top → bottom only).

| Layer | Purpose | Can Import From |
|-------|---------|-----------------|
| `app/` | App bootstrap, providers, routing, layouts | pages, widgets, features, entities, shared |
| `pages/` | Full page compositions tied to routes | widgets, features, entities, shared |
| `widgets/` | Large self-contained UI blocks (sidebar, charts) | features, entities, shared |
| `features/` | User actions & interactions (AI reply, filters) | entities, shared |
| `entities/` | Business domain models & data fetching | shared |
| `shared/` | UI kit, API client, config, utilities | shared only |

### Dependency Rule
Lower layers NEVER import from upper layers. This prevents circular dependencies and keeps the codebase scalable.

## Backend — Modular Monolith

Each module is a **bounded context** with clear responsibilities:

```
modules/
├── auth/          → Authentication, JWT, agent listing
├── tickets/       → Ticket CRUD, messages, mock email
├── customers/     → Customer profiles, health scores
├── ai/            → Sentiment analysis, AI reply generation
└── analytics/     → Dashboard metrics, copilot stats
```

### Module Internal Structure
```
module/
├── *.routes.ts      → HTTP route definitions
├── *.controller.ts  → Request/response handling
├── *.service.ts     → Business logic
├── *.types.ts       → Zod schemas & TypeScript types
└── *.repository.ts  → (optional) Data access layer
```

### Cross-Cutting Concerns (`shared/`)
- `middleware/auth.ts` — JWT verification, role authorization
- `middleware/validate.ts` — Zod request validation
- `middleware/error-handler.ts` — Centralized error responses
- `database/prisma.ts` — Singleton Prisma client
- `errors/app-error.ts` — Typed error hierarchy

## Data Model

```
User (admin/agent)
  ├── assignedTickets → Ticket[]
  ├── messages → Message[]
  └── aiReplyLogs → AiReplyLog[]

Customer
  └── tickets → Ticket[]

Ticket
  ├── customer → Customer
  ├── assignedAgent → User?
  ├── messages → Message[]
  └── aiReplyLogs → AiReplyLog[]

Message (conversation thread)
  ├── ticket → Ticket
  └── author → User?

AiReplyLog (copilot adoption tracking)
  ├── ticket → Ticket
  └── agent → User
```

## Unique Features Architecture

### 1. Sentiment Analysis Engine
- Runs on every incoming ticket (mock email or manual create)
- Keyword + pattern NLP (upgradeable to ML model)
- Outputs: sentiment enum, score (-1 to 1), auto-tags
- Tags: `urgent`, `churn-risk`, `upsell-opportunity`, `billing`, `technical-issue`

### 2. Smart Agent Routing
- On ticket creation, assigns agent with lowest open ticket count
- Urgent/negative tickets → least loaded agent (immediate attention)
- Neutral tickets → median-loaded agent (balanced distribution)

### 3. Customer Health Score (0-100)
- Computed from ticket count, negative sentiment ratio, urgent tickets
- Displayed on customer profiles and ticket detail sidebar
- Flags at-risk customers in analytics dashboard

### 4. AI Copilot with Adoption Metrics
- Generate → Accept / Edit / Reject workflow
- Every action logged to `ai_reply_logs` table
- Analytics tracks acceptance rate, edit rate, confidence scores

### 5. Real-time Updates (Socket.io)
- `ticket:created`, `ticket:updated`, `ticket:message`, `ticket:deleted`
- Frontend invalidates React Query cache on events
- Toast notifications for new tickets

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiry
- Role-based access (ADMIN, AGENT)
- Zod validation on all inputs
- CORS restricted to frontend origin

## Deployment

Docker Compose orchestrates 3 services:
1. **postgres** — Database with health checks
2. **backend** — API server with auto-migration
3. **frontend** — Nginx serving static build with API proxy
