# Changelog

> Track what we build, in order.  
> Quick reference for progress and rollback points.

---

## Format

```
## YYYY-MM-DD

### Added
- New features

### Changed  
- Modifications

### Fixed
- Bug fixes

### Notes
- Observations, issues, blockers
```

---

## 2025-12-03

### Added
- Supabase database connection (PostgreSQL)
- GitHub repository setup
- Vercel deployment: https://pixelrank-ticket-system.vercel.app/
- Cold Xpress instance deployed (separate tenant)
- Ticket contact/requester edit dropdown - ability to change ticket owner from sidebar
- **App Store Module** - extensible slot-based app system
  - App registry (`src/lib/app-registry.ts`) with AppManifest interface
  - 6 slot types: ticket-detail-sidebar, ticket-toolbar, compose-toolbar, dashboard-widget, settings-menu, contact-sidebar
  - AppSlotRenderer component for dynamic app rendering
  - useInstalledApps and useHasApp hooks
  - AI Assist app as first registered app (with panel and suggest reply button)
  - lucide-react package added for icons
- **Release Notes on Solutions Page** - Agent-facing changelog
  - Changelog parser (`src/lib/changelog-parser.ts`) to read CHANGELOG.md
  - Release Notes section on /solutions page
  - Date-based entries with section badges (Added, Changed, Fixed)
  - Auto-generated from markdown file

### Infrastructure
- Database: Supabase (Pixel Tickets V1)
- Frontend: Vercel
- Code: GitHub

### New Files
| File | Purpose |
|------|---------|
| `src/lib/app-registry.ts` | Core registry for app slots and manifests |
| `src/apps/ai-assist/index.ts` | AI Assist app registration |
| `src/apps/ai-assist/components/AIAssistPanel.tsx` | Sidebar panel component |
| `src/apps/ai-assist/components/SuggestReplyButton.tsx` | Compose toolbar button |
| `src/components/apps/AppSlotRenderer.tsx` | Renders apps for a given slot |
| `src/hooks/useInstalledApps.ts` | Fetch installed apps (mock data) |
| `src/hooks/useHasApp.ts` | Check if app is installed |

---

## 2025-12-02

### Added
- Initial project setup
- Design system v1 (basic tokens)
- Design system v2 (extracted from BoldDesk CSS)
- Dashboard page scaffold
- StatsCard component (Assigned Tickets)
- CSATCard component (Customer Satisfaction)
- Basic sidebar navigation
- Basic header with Create button
- Ticket table with pagination
- Tab navigation (Pending, Response Due, etc.)

### Changed
- Updated CSAT card from vertical to horizontal layout
- Replaced emoji icons with Lucide React icons (Smile, Meh, Frown)
- Added proper status pill colors with backgrounds

### Fixed
- CSAT icon colors (now using Lucide with correct hex colors)

### Notes
- CSAT card spacing still needs refinement
- Need micro-specs for pixel-perfect implementation
- Workflow established: cropped screenshots → detailed prompts → Claude Code
- Set up project-log structure for SaaS tracking

---

## 2025-12-01

### Added
- **AI Agent System** - Claude AI as autonomous agent
  - AI-generated tasks with confidence scores
  - Approval workflow (PENDING, APPROVED, REJECTED, AUTO_APPROVED)
  - AI action logging with audit trail
  - Configurable confidence thresholds for auto-approval
  - Multi-model support (Anthropic, OpenAI, OpenRouter)
- **Claude Chat Panel** - Interactive AI chat interface
  - Conversational task/ticket creation
  - Natural language commands
  - Action execution from chat
- **AI Usage Tracking** - Cost monitoring dashboard
  - Token counting (input/output)
  - Cost calculation in USD
  - Provider and model breakdown
  - Latency metrics

---

## 2025-11-30

### Added
- **Email Integration** - Full email channel support
  - Mailgun HTTP API for sending (bypasses SMTP port blocking)
  - IMAP support for receiving emails
  - Email templates with variable replacement
  - Email activity logging (connection, fetch, send, errors)
  - Email queue for reliable delivery
- **Workflow Automations** - Trigger-based automation rules
  - Triggers: TICKET_CREATED, TICKET_UPDATED, TIME_BASED
  - Conditions with field matching operators
  - Actions: status changes, assignments, notifications
  - Priority-ordered execution
- **SLA Policies** - Service level tracking
  - Response and resolution time targets
  - Business hours vs calendar hours
  - Priority-based escalation
  - Holiday calendar support

---

## 2025-11-29

### Added
- **Knowledge Base** - Self-service help center
  - Hierarchical category structure
  - TipTap rich text editor for articles
  - Article status (DRAFT, PUBLISHED, ARCHIVED)
  - SEO fields (meta title, description, slug)
  - View count and helpful/not helpful feedback
  - Public help center at /help
- **Canned Responses** - Quick reply templates
  - Personal and shared folders
  - Visibility levels (MYSELF, ALL, GROUP)
  - Quick insertion in reply composer

---

## 2025-11-28

### Added
- **Customer Portal** - Self-service for customers
  - Login/registration with email verification
  - Google OAuth integration
  - Password reset flow
  - View and create tickets
  - Add messages to tickets
  - Profile management
- **Portal Authentication** - Separate auth system for contacts
  - JWT tokens for API access
  - Session management
  - Contact-specific permissions

---

## 2025-11-27

### Added
- **Project Management** - Group work items
  - Project CRUD with status tracking
  - Link to companies and managers
  - Start/due date tracking
- **Task System** - Granular work tracking
  - Priority levels (LOW, MEDIUM, HIGH, URGENT)
  - Status workflow (TODO, IN_PROGRESS, DONE, CANCELLED)
  - Assignee management
  - Subtasks and checklists
  - Task notes and comments
  - Link to tickets, projects, contacts, companies
- **Time Tracking** - Log time on tasks
  - Duration tracking in minutes
  - Timer-based entries
  - Billable flag with hourly rates
- **Deliverables** - Client deliverable tracking
  - Types: Monthly Report, Content Calendar, Technical Audit, etc.
  - Status: PENDING, IN_PROGRESS, DELIVERED, APPROVED
  - File URL attachments

---

## 2025-11-26

### Added
- **Ticket Management** - Full lifecycle support
  - Create, read, update, delete tickets
  - Auto-incrementing ticket numbers
  - Status: OPEN, PENDING, RESOLVED, CLOSED
  - Priority: LOW, MEDIUM, HIGH, URGENT
  - Source tracking: PORTAL, EMAIL, PHONE, CHAT
  - Rich HTML descriptions via TipTap
- **Ticket Messaging** - Conversation system
  - Agent-to-contact messages (public)
  - Internal private notes (agent-only)
  - Message attachments
  - Author tracking (AGENT, CONTACT, SYSTEM)
- **Ticket Tags** - Categorization system
  - Create tags with colors
  - Many-to-many ticket-tag relationship
  - Bulk tag operations
- **Ticket Presence** - Collision detection
  - Track agents viewing/editing tickets
  - Typing indicators
  - Automatic cleanup

---

## 2025-11-25

### Added
- **Contact Management** - Customer profiles
  - Link contacts to companies
  - Portal login capability
  - Email verification tracking
  - Social media fields
  - Contact search
- **Company Management** - Organization profiles
  - Company website and timezone
  - Blaze.ai integration fields
  - Link to contacts, projects, tasks
- **Blaze.ai Integration** - Social media management
  - API key and workspace configuration
  - Platform connections: Facebook, Instagram, LinkedIn, TikTok, etc.
  - Activity logging

---

## 2025-11-24

### Added
- **Agent Management** - User profiles and permissions
  - Roles: AGENT, ADMIN
  - Agent types: FULL_TIME, OCCASIONAL, FIELD_TECHNICIAN
  - Ticket scope: ALL, GROUP, ASSIGNED
  - Custom signatures and avatars
  - Gamification (levels, points, badges)
- **Agent Groups** - Team organization
  - Create groups and assign agents
  - Group-based ticket filtering
  - Permission scoping
- **Notifications** - Real-time agent notifications
  - Types: PRIVATE_NOTE, STATUS_UPDATED, TICKET_ASSIGNED, MENTION
  - Mark as read/unread
  - Notification count

---

## 2025-11-23

### Added
- **Authentication** - Secure access control
  - NextAuth v5 for agent authentication
  - Separate contact authentication system
  - JWT tokens for API
  - Role-based access control
  - Middleware protection
- **Database Schema** - Prisma ORM with PostgreSQL
  - 50+ models
  - Complex relationships
  - Full schema versioning
- **Next.js App Router** - Modern framework
  - Server-side rendering
  - API routes (92 endpoints)
  - Protected routes
- **UI Components** - Reusable component library
  - Layout: Header, Sidebar
  - Dashboard: StatsCard, CSATCard, TicketTable
  - Forms and data display components
- **Rich Text Editor** - TipTap-based HTML editor
  - Code blocks, formatting, links, images
  - Tables, alignment, colors

---

## 2025-11-22

### Added
- **Global Search** - Cross-entity search
  - Search tickets, contacts, solutions
  - Relevance sorting
  - Type filtering
- **File Attachments** - Upload system
  - File metadata (name, MIME, size)
  - Cloud storage integration
  - Link to tickets and messages
- **Top Banner** - Site-wide announcements
  - Enable/disable toggle
  - Custom message and styling
  - Optional link and dismiss button

---

## Git Commits Reference

| Date | Branch | Commit Message |
|------|--------|----------------|
| 2025-12-02 | main | Backup before dashboard redesign |
| 2025-12-02 | feature/dashboard-redesign | Initial dashboard implementation |

---

## Screens Completed

| Screen | Status | Notes |
|--------|--------|-------|
| Dashboard | ✅ 100% | Stats, CSAT, ticket table |
| Ticket List | ✅ 100% | With filters, bulk actions |
| Ticket Detail | ✅ 95% | AI panels, contact edit, app slots |
| New Ticket | ✅ 100% | Modal form |
| Contacts | ✅ 100% | List & detail views |
| Companies | ✅ 100% | List & detail views |
| Projects | ✅ 100% | With tasks & deliverables |
| Settings | 🔄 80% | Admin sections in progress |
| Customer Portal | ✅ 100% | Login, tickets, knowledge base |
| Reports | 🔄 50% | Basic structure |

---

## Components Completed

| Component | Status | Location |
|-----------|--------|----------|
| Sidebar | ✅ Done | src/components/layout/ |
| Header | ✅ Done | src/components/layout/ |
| StatsCard | ✅ Done | src/components/dashboard/ |
| CSATCard | ✅ Done | src/components/dashboard/ |
| TicketTable | ✅ Done | src/components/dashboard/ |
| StatusPill | ✅ Done | src/components/ui/ |
| Pagination | ✅ Done | src/components/ui/ |
| TicketDetailClient | ✅ Done | src/components/ticket-detail/ |
| AIAssistPanel | ✅ Done | src/components/ticket-detail/ |
| AskClaudePanel | ✅ Done | src/components/ticket-detail/ |
| ReplyComposer | ✅ Done | src/components/ticket-detail/ |
| ContactCard | ✅ Done | src/components/ticket-detail/ |
| PropertiesCard | ✅ Done | src/components/ticket-detail/ |
| AppSlotRenderer | ✅ Done | src/components/apps/ |
| AI Assist App | ✅ Done | src/apps/ai-assist/ |
