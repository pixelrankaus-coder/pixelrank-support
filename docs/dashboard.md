# Screen Spec: Agent Dashboard

> Read `/docs/design-system.md` before implementing this screen.

---

## Overview

The Agent Dashboard is the home screen for support agents. It provides a quick overview of their workload, customer satisfaction metrics, and easy access to their ticket queue.

**Route:** `/dashboard` or `/`  
**Permissions:** Authenticated agents

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER                                                              │
│ [Page Title: "My Dashboard"]                    [Search] [Create ▾] │
├────┬────────────────────────────────────────────────────────────────┤
│    │                                                                │
│ S  │  ┌─────────────────────────────────────────────────────────┐  │
│ I  │  │ WELCOME CARD (optional onboarding)                      │  │
│ D  │  └─────────────────────────────────────────────────────────┘  │
│ E  │                                                                │
│ B  │  ┌──────────────────────────┐ ┌────────────────────────────┐  │
│ A  │  │ ASSIGNED TICKETS STATS   │ │ CUSTOMER SATISFACTION      │  │
│ R  │  │ Pending | On Hold | etc  │ │ Donut + Breakdown          │  │
│    │  └──────────────────────────┘ └────────────────────────────┘  │
│    │                                                                │
│    │  ┌─────────────────────────────────────────────────────────┐  │
│    │  │ TAB BAR                                                  │  │
│    │  │ Pending | Response Due | Resolution Due | Created | ... │  │
│    │  ├─────────────────────────────────────────────────────────┤  │
│    │  │ FILTERS & SEARCH                                        │  │
│    │  │ [Search] [Status Pills] [Sort ▾] [Columns ▾]            │  │
│    │  ├─────────────────────────────────────────────────────────┤  │
│    │  │ TICKET TABLE                                            │  │
│    │  │ ID | Subject | Created On | Status | Brand              │  │
│    │  │ ─────────────────────────────────────────────────────── │  │
│    │  │ 4  | Sample Ticket: How to... | Dec 01... | Open | Ind  │  │
│    │  ├─────────────────────────────────────────────────────────┤  │
│    │  │ PAGINATION                                              │  │
│    │  │ [«] [‹] [1] [›] [»]               1 of 1 pages (1 item) │  │
│    │  └─────────────────────────────────────────────────────────┘  │
│    │                                                                │
└────┴────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Header Bar

| Element | Spec |
|---------|------|
| Page title | "My Dashboard", 20px semibold |
| Search | Input with search icon, placeholder: "Search", width ~200px |
| Create button | Primary dropdown button with chevron, options: Ticket, Article, Activity |
| Notification icons | Help, integrations, notifications, phone icons |
| Avatar | 32px circle, user initials or image |

### 2. View Toggle (Radio Group)

Three options in horizontal radio group:
- **My Tickets** (default selected)
- **My Groups**
- **Agent**

Position: Below header, left aligned.

Right side links (text buttons):
- Requested Approvals (0)
- Pending Approvals (0)  
- Pending Activities (0)

### 3. Assigned Tickets Stats Card

**Title:** "Assigned Tickets"

Four stat columns in a row:

| Stat | Label | Info tooltip |
|------|-------|--------------|
| 1 | Pending | - |
| 0 | On Hold | - |
| 0 | Resolution Due | ⓘ "Tickets due for resolution" |
| 0 | Response Due | ⓘ "Tickets awaiting first response" |

- Numbers: 32px bold
- Labels: 12px secondary color
- Info icons trigger tooltip on hover

### 4. Customer Satisfaction Card

**Title:** "Customer Satisfaction" + "(Last 30 days)" in muted text

**Layout:** Two columns

Left side - three metric rows:
| Icon | Label | Value | Subtext |
|------|-------|-------|---------|
| 😊 (green) | Positive | 0% | 0 Rating |
| 😐 (amber) | Neutral | 0% | 0 Rating |
| 😞 (red) | Negative | 0% | 0 Rating |

Right side - CSAT donut:
- Circular progress (empty when 0%)
- Center text: "0%" large, "CSAT" small below
- Gray ring when no data

### 5. Ticket Tabs

Horizontal scrollable tab bar:

| Tab | Count | Has info icon |
|-----|-------|---------------|
| Pending | (1) | No |
| Response Due | (0) | Yes |
| Resolution Due | (0) | Yes |
| Created | - | No |
| Requested | - | No |
| Participated | - | Yes |
| Mentioned | - | No |
| Shared With Me | - | No |
| Shared With My Groups | - | No |
| Watching | - | No |
| CC'd | - | No |
| Closed | - | No |

Active tab: Primary color text + underline or pill background

### 6. Table Toolbar

**Left side:**
- Search input: "Search by Title or ID"
- Status filter pills: "Pending" (active), "Hold"

**Right side:**
- Sort dropdown: "Created - Desc ▾"
- Columns dropdown: "Columns ▾" with checkboxes

### 7. Ticket Table

**Columns:**

| Column | Width | Content |
|--------|-------|---------|
| Ticket ID | 100px | Link style, clickable |
| Subject | flex | Primary text |
| Created On | 180px | "Dec 01, 2025 02:10 PM" format |
| Status | 100px | Status pill (e.g., "Open" green) |
| Brand | 120px | Text |

**Row behavior:**
- Hover: bg-hover background
- Click: Navigate to ticket detail
- Ticket ID: Primary link color

### 8. Pagination

**Left side:**
- First page button (double chevron)
- Previous button
- Page number (active state for current)
- Next button  
- Last page button

**Right side:**
- "1 of 1 pages (1 item)" text

---

## State Handling

### Loading State
- Show skeleton loaders for stat cards
- Show skeleton rows in table (3-5 rows)

### Empty State (No tickets)
- Hide table
- Show centered empty state:
  - Illustration (optional)
  - "No pending tickets"
  - "You're all caught up! Check other tabs for more tickets."

### Error State
- Show error card with retry button
- "Failed to load dashboard. Please try again."

---

## Data Requirements

### API Endpoints Needed

```
GET /api/dashboard/stats
Response: {
  pending: number,
  onHold: number,
  resolutionDue: number,
  responseDue: number
}

GET /api/dashboard/csat?period=30d
Response: {
  positive: { percentage: number, count: number },
  neutral: { percentage: number, count: number },
  negative: { percentage: number, count: number },
  overall: number
}

GET /api/tickets?tab=pending&page=1&sort=created&order=desc
Response: {
  data: Ticket[],
  pagination: {
    page: number,
    totalPages: number,
    totalItems: number
  }
}
```

### Ticket Type
```typescript
interface Ticket {
  id: number;
  subject: string;
  createdAt: string;      // ISO date
  status: 'open' | 'pending' | 'on_hold' | 'closed';
  brand: string;
  contact: {
    id: number;
    name: string;
  };
}
```

---

## Interactions

| Action | Result |
|--------|--------|
| Click ticket row | Navigate to `/tickets/:id` |
| Click ticket ID link | Navigate to `/tickets/:id` |
| Change tab | Reload table with new filter |
| Click status pill | Toggle filter |
| Change sort | Reload table with new sort |
| Click Create > Ticket | Open new ticket modal or navigate to `/tickets/new` |
| Click pagination | Load corresponding page |

---

## Implementation Notes

1. Use React Query or SWR for data fetching with caching
2. Tabs should update URL params (`?tab=pending`)
3. Table sort/filter state in URL for shareability
4. CSAT donut can use a simple SVG circle or Recharts
5. Consider virtualization if ticket list can be very long
6. Mobile: Stack stat cards vertically, horizontal scroll for tabs

---

## Files to Create/Modify

```
src/
├── pages/
│   └── Dashboard.tsx           # Main page component
├── components/
│   └── dashboard/
│       ├── StatsCard.tsx       # Assigned tickets stats
│       ├── CSATCard.tsx        # Customer satisfaction with donut
│       ├── TicketTabs.tsx      # Tab navigation
│       ├── TicketTable.tsx     # Data table
│       └── DashboardToolbar.tsx # Search, filters, sort
├── hooks/
│   ├── useDashboardStats.ts    # Fetch stats
│   ├── useCSAT.ts              # Fetch CSAT data
│   └── useTickets.ts           # Fetch ticket list
└── types/
    └── dashboard.ts            # TypeScript interfaces
```

---

## Acceptance Criteria

- [ ] Stats card shows Pending, On Hold, Resolution Due, Response Due counts
- [ ] CSAT card shows donut chart with percentage and breakdown
- [ ] Tabs switch content and update URL
- [ ] Table displays tickets with proper columns
- [ ] Table rows are clickable and navigate to detail
- [ ] Status pills filter the table
- [ ] Sort dropdown works
- [ ] Pagination works
- [ ] Loading states display properly
- [ ] Empty state shows when no tickets
- [ ] Responsive on tablet/mobile
