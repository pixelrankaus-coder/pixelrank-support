# Decision Log

> Track design, UX, and technical decisions made during development.  
> Format: Date | Decision | Reasoning | SaaS Impact

---

## December 2025

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
