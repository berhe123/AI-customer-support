# SupportAI — AI Customer Support Dashboard

A production-ready SaaS customer support platform with AI-powered reply suggestions, real-time sentiment analysis, smart ticket routing, and customer health scoring.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-20-green) ![Stack](https://img.shields.io/badge/PostgreSQL-16-blue) ![Stack](https://img.shields.io/badge/TypeScript-strict-blue)

## What Makes SupportAI Unique

Compared to Zendesk, Intercom, and other helpdesk tools, SupportAI includes:

| Feature | SupportAI | Typical Helpdesk |
|---------|-----------|------------------|
| **Real-time Sentiment Analysis** | Auto-detects urgent, negative, churn-risk, upsell signals | Manual tagging or add-on |
| **AI Copilot with Adoption Metrics** | Tracks accept/edit/reject rates and confidence scores | Basic AI suggestions only |
| **Smart Agent Routing** | Routes by sentiment + agent workload | Manual assignment |
| **Customer Health Score** | Composite score from ticket history | Not included |
| **Churn Risk Detection** | Auto-tags competitor mentions | Requires separate tool |
| **Mock Email Inbox** | Simulates incoming emails as tickets | Requires Gmail integration |

## Architecture

### Frontend — Feature-Sliced Design (FSD)

```
frontend/src/
├── app/                    # Application layer
│   ├── index.tsx           # App entry + routing
│   ├── layouts/            # Dashboard layout
│   └── providers/          # React Query, Theme, Auth, Socket
├── pages/                  # Route-level page compositions
│   ├── login/
│   ├── register/
│   ├── overview/
│   ├── tickets/
│   ├── ticket-detail/
│   ├── customers/
│   ├── customer-detail/
│   ├── analytics/
│   └── settings/
├── widgets/                # Composite UI blocks
│   ├── sidebar/
│   └── topbar/
├── features/               # User interactions
│   └── ai-reply/           # AI Copilot panel
├── entities/               # Business entities
│   └── ticket/             # Ticket API hooks
└── shared/                 # Reusable infrastructure
    ├── api/                # Axios client + API modules
    ├── config/             # Theme, env config
    ├── lib/                # Zustand stores, Socket.io
    ├── types/              # Shared TypeScript types
    └── ui/                 # StatusChip, EmptyState, etc.
```

### Backend — Modular Monolith

```
backend/src/
├── server.ts               # HTTP + Socket.io bootstrap
├── app.ts                  # Express app factory
├── config/                 # Environment validation (Zod)
├── shared/                 # Cross-cutting concerns
│   ├── database/           # Prisma client
│   ├── errors/             # AppError hierarchy
│   ├── middleware/         # Auth, validation, error handler
│   └── types/              # Pagination, API response types
└── modules/                # Feature modules (bounded contexts)
    ├── auth/               # Register, login, JWT, agents
    ├── tickets/            # CRUD, messages, filters
    ├── customers/          # Customer profiles + history
    ├── ai/                 # Sentiment + AI reply generation
    ├── analytics/          # Dashboard metrics
    └── (mock-email via tickets module)
```

Each module follows: `*.routes.ts` → `*.controller.ts` → `*.service.ts` → `*.types.ts`

## Tech Stack

**Frontend:** React 18, Vite, TypeScript (strict), React Router, React Query, Zustand, Material UI, Axios, Recharts, Socket.io-client

**Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT, bcrypt, Socket.io, Zod validation

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm

### 1. Start Database

```bash
docker compose up postgres -d
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API runs at `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Demo Accounts

| Role  | Email                   | Password     |
|-------|-------------------------|--------------|
| Admin | admin@aisupport.com     | password123  |
| Agent | agent1@aisupport.com    | password123  |
| Agent | agent2@aisupport.com    | password123  |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login, returns JWT
- `GET /api/auth/me` — Current user profile
- `GET /api/auth/agents` — List agents with workload

### Tickets
- `GET /api/tickets` — List with filters, search, pagination
- `GET /api/tickets/:id` — Ticket detail with messages
- `POST /api/tickets` — Create ticket
- `PUT /api/tickets/:id` — Update status/priority/agent
- `DELETE /api/tickets/:id` — Delete ticket
- `POST /api/tickets/:id/messages` — Add agent reply
- `POST /api/tickets/:id/ai-log` — Log AI copilot action

### AI
- `POST /api/ai/reply` — Generate AI reply suggestion

### Customers
- `GET /api/customers` — List customers
- `GET /api/customers/:id` — Customer profile + ticket history

### Analytics
- `GET /api/analytics/overview` — Dashboard metrics

### Mock Email
- `POST /api/mock/email` — Simulate incoming email → creates ticket

## Docker (Full Stack)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432

## Testing

```bash
# Backend unit tests
cd backend && npm test

# Frontend type check
cd frontend && npm run lint
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://ai_support:ai_support_secret@localhost:5432/ai_customer_support
JWT_SECRET=your-secret-key-min-8-chars
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=           # Optional — falls back to mock AI
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

## Real-time Features

Socket.io events:
- `ticket:created` — New ticket notification
- `ticket:updated` — Ticket status/assignment changes
- `ticket:message` — New message in conversation
- `ticket:deleted` — Ticket removed

## License

MIT
