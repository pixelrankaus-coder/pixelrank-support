# Ticket System V1 (Helpdesk)

## Project Overview
A Freshdesk-style helpdesk ticket system built with Next.js. Single-tenant, full-featured support desk with email integration, knowledge base, SLAs, and AI assistance.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite (via Prisma) |
| ORM | Prisma 5.x |
| Auth | NextAuth v5 (beta) |
| Styling | Tailwind CSS |
| Rich Text | TipTap |
| Charts | Recharts |
| Email | Nodemailer + IMAP |

---

## Project Structure

```
Ticket System V1/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities, helpers, API functions
│   ├── types/            # TypeScript type definitions
│   └── middleware.ts     # Auth middleware
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data script
│
├── Rules/                # Project rules/documentation
├── .claude/              # Claude Code settings
├── CLAUDE.md             # This file
└── package.json
```

---

## Common Commands

```bash
# Development
npm run dev               # Start dev server (localhost:3000)

# Database
npm run db:push           # Push schema changes (no migration)
npm run db:seed           # Seed database with sample data
npm run db:studio         # Open Prisma Studio GUI

# Build
npm run build             # Production build
npm run start             # Start production server
npm run lint              # Run ESLint
```

---

## Database Models Overview

### Core Entities
| Model | Purpose |
|-------|---------|
| `User` | Agents/Admins who handle tickets |
| `Contact` | Customers who submit tickets |
| `Company` | Customer organizations |
| `Ticket` | Support tickets |
| `TicketMessage` | Replies and notes on tickets |

### Supporting Features
| Model | Purpose |
|-------|---------|
| `Group` / `GroupMember` | Agent teams |
| `Tag` / `TicketTag` | Ticket categorization |
| `CannedResponse` / `CannedResponseFolder` | Quick reply templates |
| `SLAPolicy` / `SLATarget` | Service level agreements |
| `BusinessHours` / `BusinessSchedule` / `Holiday` | Operating hours |
| `Automation` | Workflow automation rules |
| `EmailChannel` | Email configuration (SMTP/IMAP) |
| `EmailTemplate` / `EmailLog` | Email templates and tracking |
| `KBCategory` / `KBArticle` / `KBArticleFeedback` | Knowledge base |
| `AISettings` | AI provider configuration |
| `Notification` | Agent notifications |
| `AgentBadge` | Gamification badges |
| `TicketPresence` | Collision detection |
| `Counter` | Auto-increment ticket numbers |

---

## Key Patterns

### Ticket Statuses
```typescript
type TicketStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED'
```

### Ticket Priorities
```typescript
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
```

### Ticket Sources
```typescript
type Source = 'PORTAL' | 'EMAIL' | 'PHONE' | 'CHAT'
```

### User Roles
```typescript
type UserRole = 'AGENT' | 'ADMIN'
```

### Message Author Types
```typescript
type AuthorType = 'AGENT' | 'CONTACT' | 'SYSTEM'
```

---

## Environment Variables

Create a `.env` file:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# AI (optional)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Email (configure in admin UI via EmailChannel model)
```

---

## Authentication Flow

- Uses NextAuth v5 with credentials provider
- Agents log in at `/login`
- Contacts can log in to customer portal (if `passwordHash` is set)
- Protected routes use middleware at `src/middleware.ts`

---

## API Routes (Next.js App Router)

API routes are in `src/app/api/`. Common patterns:

```typescript
// GET /api/tickets
// POST /api/tickets
// GET /api/tickets/[id]
// PATCH /api/tickets/[id]
// DELETE /api/tickets/[id]
```

---

## Ticket Number Generation

Uses a `Counter` model to auto-increment ticket numbers:

```typescript
// Increment and get next ticket number
const counter = await prisma.counter.upsert({
  where: { id: 'ticket_number' },
  update: { value: { increment: 1 } },
  create: { id: 'ticket_number', value: 1 }
})
const ticketNumber = counter.value
```

---

## AI Features

Tickets have AI assist fields:
- `aiSummary` - AI-generated ticket summary
- `aiReply` - AI-suggested reply
- `aiGeneratedAt` - When AI was last used
- `aiModel` - Which model generated the response

Configure in `AISettings` model (provider: `anthropic` or `openai`)

---

## Email Integration

### Outbound (SMTP)
- Configure via `EmailChannel` model
- Uses Nodemailer
- Templates stored in `EmailTemplate`
- Logs tracked in `EmailLog`

### Inbound (IMAP)
- Optional IMAP settings in `EmailChannel`
- Uses `imap` and `mailparser` packages
- Creates tickets from incoming emails

---

## SLA System

1. Create `SLAPolicy` with targets per priority
2. `SLATarget` defines:
   - `firstResponseTime` (minutes)
   - `resolutionTime` (minutes)
   - `operationalHours` (BUSINESS or CALENDAR)
3. Tickets track:
   - `firstResponseDue`
   - `resolutionDue`
   - `firstRespondedAt`
   - `resolvedAt`

---

## Knowledge Base

Hierarchical structure:
- `KBCategory` - Can have parent categories
- `KBArticle` - Belongs to a category
- `KBArticleFeedback` - Helpful/not helpful votes

Article statuses: `DRAFT`, `PUBLISHED`, `ARCHIVED`

---

## Code Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `ticketId` |
| Components | PascalCase | `TicketList` |
| Files | kebab-case | `ticket-list.tsx` |
| API routes | kebab-case | `api/tickets/[id]/route.ts` |
| Database enums | UPPER_SNAKE | `OPEN`, `PENDING` |

---

## Component Patterns

### TipTap Rich Text Editor
Already configured with extensions:
- Code blocks, highlighting, colors
- Links, images, tables
- Text alignment, underline
- Placeholder text

### Forms
Use controlled components with React state.

---

## Useful Queries

```typescript
// Get ticket with all relations
const ticket = await prisma.ticket.findUnique({
  where: { id },
  include: {
    contact: true,
    assignee: true,
    group: true,
    messages: {
      include: {
        agentAuthor: true,
        contactAuthor: true
      },
      orderBy: { createdAt: 'asc' }
    },
    tags: { include: { tag: true } }
  }
})

// Get open tickets count
const openCount = await prisma.ticket.count({
  where: { status: 'OPEN' }
})

// Search tickets
const tickets = await prisma.ticket.findMany({
  where: {
    OR: [
      { subject: { contains: searchTerm } },
      { description: { contains: searchTerm } }
    ]
  }
})
```

---

## Differences from Pixel Rank CRM v2

| Aspect | Ticket System V1 | Pixel Rank CRM v2 |
|--------|------------------|-------------------|
| Multi-tenant | No (single tenant) | Yes (tenantId everywhere) |
| Database | SQLite | PostgreSQL |
| Framework | Next.js (monolith) | NestJS + React (split) |
| File Storage | Not implemented | Cloudflare R2 |
| Auth | NextAuth | Custom JWT |

---

## Tips for Claude Code

1. **No tenantId** - This is single-tenant, don't add tenant filtering
2. **SQLite limitations** - No `@db.Text`, some JSON features differ
3. **App Router** - Use `src/app` structure for routes
4. **Server Components** - Default in Next.js 14, use `'use client'` when needed
5. **Prisma pushes** - Use `npm run db:push` for quick schema changes
6. **Check existing patterns** - Look at similar components before creating new ones

---

## Troubleshooting Rules (Lessons Learned)

### Debugging Approach
1. **Ask about infrastructure first** - When something works locally but fails in production, immediately ask:
   - "What hosting provider are you using?" (DigitalOcean, AWS, Vercel, etc.)
   - "Does this work locally but fail on the server?"
   - Check for known provider limitations before diving into code fixes

2. **Don't assume code is the problem** - Infrastructure issues are common:
   - Cloud providers often block SMTP ports (25, 465, 587)
   - Firewall rules may differ between environments
   - DNS, SSL, and network configurations vary by host

3. **Test both environments early** - When implementing features that involve external services:
   - Test locally first
   - Deploy and test on production immediately
   - Don't wait until "everything is done" to test production

### Production Deployment (DigitalOcean)
- **Server**: `134.199.165.188`
- **App Path**: `/var/www/pixelrank-support`
- **Process Manager**: PM2 (`pm2 restart pixelrank-support`)
- **SMTP is blocked** - DigitalOcean blocks all outbound SMTP ports (25, 465, 587, 2525) by default for spam prevention. Use Mailgun HTTP API instead (port 443 works).
- **Deploy script**: `powershell -ExecutionPolicy Bypass -File deploy.ps1`

### Email Configuration
- **Primary**: Mailgun HTTP API (bypasses SMTP port blocking)
- **Fallback**: SMTP via Nodemailer (works locally, may fail on cloud hosts)
- **Incoming**: IMAP on port 993 (works on DigitalOcean)
- **Domain**: `tickets.pixelrank.com.au`

### Mailgun Specifics
- **API keys do NOT start with `key-`** - They look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxx`
- **Find API key at**: Settings → API Security (NOT Domain settings → Sending keys)
- **API endpoint**: `https://api.mailgun.net/v3` (US) or `https://api.eu.mailgun.net/v3` (EU)

### Error Messages Should Be Helpful
When building error handling, include:
- What went wrong
- Possible causes (especially infrastructure issues)
- Suggested fixes
- Example: "SMTP timed out. If on DigitalOcean/AWS, SMTP ports may be blocked. Use Mailgun HTTP API."

---

## Continuous Improvement

When we encounter issues, add learnings here:
- Infrastructure gotchas
- Provider-specific limitations
- Debugging patterns that worked
- Error messages that could be clearer

---

## Claude Agent Integration

### Overview
Claude can act as an AI agent in the system, creating tasks and notes via API. All AI-generated content is tracked with:
- `aiGenerated: true` flag
- `aiReasoning` - Why Claude created this
- `aiConfidence` - Confidence score (0.0-1.0)
- `approvalStatus` - PENDING, APPROVED, REJECTED, AUTO_APPROVED

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-agent/tasks` | POST | Create a task via AI |
| `/api/ai-agent/tasks` | GET | List AI-generated tasks |
| `/api/ai-agent/notes` | POST | Add a note to a task |
| `/api/ai-agent/actions` | GET | List AI action logs |
| `/api/ai-agent/actions/[id]` | PATCH | Approve/reject an action |
| `/api/ai-agent/config` | GET/PATCH | AI confidence configuration |

### Authentication
AI agent endpoints use Bearer token authentication:
```bash
Authorization: Bearer <AI_AGENT_API_KEY>
```

Set `AI_AGENT_API_KEY` in environment variables.

### Creating a Task via AI
```typescript
POST /api/ai-agent/tasks
{
  "title": "Follow up with client",
  "description": "Schedule call to discuss project status",
  "priority": "MEDIUM",
  "dueDate": "2025-01-15T09:00:00Z",
  "ticketId": "clxxx...",
  "aiReasoning": "Client requested follow-up in ticket conversation",
  "aiConfidence": 0.85,
  "aiModel": "claude-sonnet-4-5-20250929"
}
```

### Approval Workflow
1. Tasks created with confidence >= 0.85 can be auto-approved (if enabled)
2. Lower confidence tasks go to PENDING status
3. Admins can approve/reject via `/api/ai-agent/actions/[id]`

### Key Files
- `src/lib/ai-agent.ts` - AI agent helper functions
- `src/app/api/ai-agent/` - API routes
- `src/components/ai/ai-badge.tsx` - AI badge component
- `prisma/schema.prisma` - `AIActionLog`, `AIConfidenceConfig` models

### Claude System User
- Email: `claude@ai.system`
- ID: `claude-ai-agent-9999`
- `isAiAgent: true`
- Created by seed script

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| View database | `npm run db:studio` |
| Push schema | `npm run db:push` |
| Seed data | `npm run db:seed` |
| Build | `npm run build` |
