# Decision Log

> Track design, UX, and technical decisions made during development.  
> Format: Date | Decision | Reasoning | SaaS Impact

---

## December 2025

### 2025-12-03 | Hosting Architecture
**Decision:** Supabase + Vercel instead of Digital Ocean
**Reasoning:** Built-in auth, RLS for multi-tenant, real-time updates, cheaper, faster to ship
**SaaS Impact:** ✅ Perfect for SaaS — RLS ready for tenant isolation

---

### 2025-12-03 | Multi-Instance Strategy
**Decision:** Separate deployments per client (Pixel Rank, Cold Xpress)
**Reasoning:** Faster iteration, easy customization per client
**SaaS Impact:** ⚠️ Will consolidate to single multi-tenant app later

---

### 2025-12-03 | App Store Architecture
**Decision:** Slot-based extensible app system with client-side registry
**Reasoning:** Allows adding features as pluggable apps, enables per-tenant app installation, supports future marketplace
**SaaS Impact:** ✅ Perfect for SaaS — each tenant can have different apps enabled

---

### 2025-12-03 | App Slot Locations
**Decision:** 6 initial slots: ticket-detail-sidebar, ticket-toolbar, compose-toolbar, dashboard-widget, settings-menu, contact-sidebar
**Reasoning:** Cover main extension points without over-engineering; easy to add more slots later
**SaaS Impact:** ✅ None — slots are universal, apps are tenant-specific

---

### 2025-12-02 | Design System Source
**Decision:** Base design system on BoldDesk's UI patterns  
**Reasoning:** Professional, proven ticket system UI. Clean, modern aesthetic.  
**SaaS Impact:** ⚠️ Will need theming system — colors should come from config, not hardcoded.

---

### 2025-12-02 | Icon Library
**Decision:** Use Lucide React for all icons  
**Reasoning:** Consistent, tree-shakeable, matches BoldDesk style  
**SaaS Impact:** ✅ None — icons are universal

---

### 2025-12-02 | CSAT Visualization
**Decision:** Horizontal layout with donut chart on right  
**Reasoning:** Matches BoldDesk, better use of space than vertical stack  
**SaaS Impact:** ✅ None — component is reusable

---

### 2025-12-02 | Status Pill Colors
**Decision:** Use semantic colors for status states
- Open: Green (#069454 on #ecfcf2)
- Pending: Amber (#db6803 on #fff9eb)
- On Hold: Amber (#db6803 on #fef0c7)
- Closed: Gray (#344054 on #f2f4f7)

**Reasoning:** Industry standard, accessible, instantly recognizable  
**SaaS Impact:** ⚠️ Some tenants may want custom statuses — need configurable status system

---

## Template

```
### YYYY-MM-DD | Decision Title
**Decision:** What we decided  
**Reasoning:** Why we decided it  
**SaaS Impact:** ✅ None | ⚠️ Needs consideration | 🔴 Must change for SaaS
```
