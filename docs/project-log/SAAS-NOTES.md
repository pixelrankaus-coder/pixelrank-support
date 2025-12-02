# SaaS Architecture Notes

> Track everything that needs to change for multi-tenant SaaS version.  
> This is our "don't forget" list for v2.

---

## Current State: Single-Tenant Prototype

We're building fast and loose to nail the design and workflow.  
This file tracks what we're "skipping for now" that must be addressed for SaaS.

---

## 📦 Third-Party Libraries

> Build vs Buy decisions. Only use well-maintained, MIT/Apache licensed libraries.

### UI Framework & Components

| Library | Purpose | License | SaaS Ready? |
|---------|---------|---------|-------------|
| React | UI framework | MIT | ✅ |
| shadcn/ui | Base components (buttons, inputs, dropdowns) | MIT | ✅ |
| Tailwind CSS | Styling | MIT | ✅ |
| Lucide React | Icons | ISC | ✅ |

### Complex Components (Don't Build These)

| Library | Purpose | License | SaaS Ready? |
|---------|---------|---------|-------------|
| **Tiptap** | Rich text editor (replies, notes) | MIT | ✅ |
| TanStack Table | Data tables with sorting/filtering | MIT | ✅ |
| react-day-picker | Date pickers | MIT | ✅ |
| Recharts | Charts (CSAT donut, reports) | MIT | ✅ |

### Planned / Considering

| Library | Purpose | Decision |
|---------|---------|----------|
| Tiptap @mentions | @mention agents in replies | ✅ Use |
| Tiptap slash commands | / commands for quick actions | ✅ Use |
| react-dropzone | File uploads | Evaluating |
| Uppy | Advanced file uploads | Evaluating |

### Rule of Thumb

| Component Type | Build or Find? |
|----------------|----------------|
| Rich text editor | **Find** (Tiptap) |
| Date/time picker | **Find** (react-day-picker) |
| Data tables | **Find** (TanStack Table) |
| Charts/graphs | **Find** (Recharts) |
| File upload | **Find** (react-dropzone or Uppy) |
| Modals, tooltips, dropdowns | **Find** (shadcn/ui) |
| Email templates | **Find** (react-email) |
| PDF generation | **Find** (react-pdf) |
| Custom layouts | **Build** |
| Business logic | **Build** |
| Ticket-specific components | **Build** |

### Installation Commands

```bash
# Rich text editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/extension-link

# Data table
npm install @tanstack/react-table

# Charts
npm install recharts

# Date picker
npm install react-day-picker date-fns
```

---

## 🔴 Must Change for SaaS

### 1. Database: Add tenant_id Everywhere
**Current:** Single tenant, no isolation  
**SaaS Need:** Every table needs `tenant_id` column

```sql
-- Every table needs this pattern:
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  -- ... other columns
  
  INDEX idx_tenant (tenant_id)
);

-- Every query needs tenant filter:
SELECT * FROM tickets WHERE tenant_id = ? AND ...
```

**Tables that will need tenant_id:**
- [ ] users
- [ ] tickets
- [ ] contacts
- [ ] tasks
- [ ] comments
- [ ] attachments
- [ ] settings
- [ ] custom_fields
- [ ] ... (all of them)

---

### 2. Authentication: Per-Tenant + SSO
**Current:** Basic auth (if any)  
**SaaS Need:**
- [ ] Tenant-scoped login (subdomain or path-based)
- [ ] SSO support (SAML, OAuth)
- [ ] Invite system
- [ ] Role-based access per tenant
- [ ] API keys per tenant

**Options:**
- Auth0 / Clerk / Supabase Auth
- Self-hosted with tenant context

---

### 3. Branding: Configurable Per Tenant
**Current:** Hardcoded Pixel Rank branding  
**SaaS Need:**
- [ ] Tenant logo upload
- [ ] Primary color customization
- [ ] Custom domain support
- [ ] Email templates with tenant branding

**Implementation:**
```typescript
// Theme config per tenant
interface TenantBranding {
  logo: string;
  primaryColor: string;
  accentColor: string;
  favicon: string;
  companyName: string;
}
```

---

### 4. Data Isolation
**Current:** All data in one pool  
**SaaS Need:**
- [ ] Row-level security OR
- [ ] Schema-per-tenant OR  
- [ ] Database-per-tenant (expensive)

**Recommendation:** Row-level security with tenant_id is most practical for start.

---

## ⚠️ Should Consider for SaaS

### 5. Custom Fields
**Current:** Fixed schema  
**SaaS Need:** Tenants want custom ticket fields

```typescript
interface CustomField {
  tenant_id: number;
  entity_type: 'ticket' | 'contact' | 'task';
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'multi_select';
  options?: string[]; // for select types
  required: boolean;
}
```

---

### 6. Custom Statuses
**Current:** Fixed statuses (Open, Pending, On Hold, Closed)  
**SaaS Need:** Tenants may want custom workflow states

```typescript
interface CustomStatus {
  tenant_id: number;
  name: string;
  color: string;
  bg_color: string;
  order: number;
  is_closed: boolean; // marks ticket as resolved
}
```

---

### 7. Billing Integration
**Current:** None  
**SaaS Need:**
- [ ] Stripe subscription management
- [ ] Usage tracking (tickets, agents, storage)
- [ ] Plan limits enforcement
- [ ] Trial management

---

### 8. API Rate Limiting
**Current:** None  
**SaaS Need:**
- [ ] Per-tenant rate limits
- [ ] API key management
- [ ] Usage analytics

---

### 9. Email Infrastructure
**Current:** TBD  
**SaaS Need:**
- [ ] Per-tenant email routing
- [ ] Custom SMTP support
- [ ] Email-to-ticket parsing
- [ ] Deliverability monitoring

---

## 💡 Design Patterns to Use Now

Even in prototype, these patterns make SaaS conversion easier:

### Use Context for Tenant
```typescript
// Set up early, even if always returns same tenant
const TenantContext = createContext<Tenant | null>(null);

function useTenant() {
  return useContext(TenantContext);
}
```

### Abstract Data Access
```typescript
// Don't scatter queries everywhere
// Use a service layer that can add tenant_id later
class TicketService {
  async getTickets(filters: TicketFilters) {
    // Easy to add: WHERE tenant_id = currentTenant.id
  }
}
```

### Config Over Hardcoding
```typescript
// Instead of:
const PRIMARY_COLOR = '#7e56d8';

// Use:
const theme = useTheme(); // can pull from tenant config later
const primaryColor = theme.primaryColor;
```

---

## Conversion Checklist (For When We're Ready)

- [ ] Create tenants table
- [ ] Add tenant_id to all tables
- [ ] Migrate existing data to tenant 1
- [ ] Add tenant context to auth
- [ ] Update all queries with tenant filter
- [ ] Build tenant onboarding flow
- [ ] Add billing integration
- [ ] Add tenant admin settings
- [ ] Set up subdomain routing
- [ ] Security audit for data isolation
