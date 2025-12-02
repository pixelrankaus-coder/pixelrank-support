# Component Library Log

> Track reusable components as we build them.  
> Each component should be documented here once finalized.

---

## Status: Finalized ✅ | In Progress 🔄 | Needs Refinement ⚠️

---

## Layout Components

### Sidebar
**Status:** 🔄 In Progress  
**Location:** `src/components/layout/Sidebar.tsx`  
**Props:** TBD  
**Notes:** 
- 56px width, dark purple (#793aee)
- Icon-only navigation
- Need to add: active state, hover state, mobile collapse

### Header
**Status:** 🔄 In Progress  
**Location:** `src/components/layout/Header.tsx`  
**Props:** TBD  
**Notes:**
- 56px height, white bg
- Contains: page title, search, create button, notifications, avatar

---

## Data Display Components

### StatsCard
**Status:** 🔄 In Progress  
**Location:** `src/components/dashboard/StatsCard.tsx`  
**Props:**
```typescript
interface StatsCardProps {
  title: string;
  stats: {
    label: string;
    value: number;
    hasInfo?: boolean;
    infoText?: string;
  }[];
}
```
**Specs:**
- Card padding: 24px
- Label: 12px, #667085
- Value: 36px bold, #101828
- Info icon: 14px, #98a1b2
- 4 columns, evenly distributed

### CSATCard
**Status:** ⚠️ Needs Refinement  
**Location:** `src/components/dashboard/CSATCard.tsx`  
**Props:**
```typescript
interface CSATCardProps {
  positive: { percentage: number; count: number };
  neutral: { percentage: number; count: number };
  negative: { percentage: number; count: number };
  overall: number;
  period?: string; // "Last 30 days"
}
```
**Specs:**
- Horizontal layout: ratings left, donut right
- Rating columns gap: 48px
- Icons: Lucide Smile/Meh/Frown (20px)
- Donut: 72px, 6px stroke
- See DESIGN-SYSTEM.md section 6 for full spec

### StatusPill
**Status:** 🔄 In Progress  
**Location:** `src/components/ui/StatusPill.tsx`  
**Props:**
```typescript
interface StatusPillProps {
  status: 'open' | 'pending' | 'on_hold' | 'closed';
}
```
**Specs:**
- Padding: 2px 8px
- Border radius: 4px
- Font: 12px, weight 500
- Colors: See DESIGN-SYSTEM.md

### DataTable
**Status:** 🔄 In Progress  
**Location:** `src/components/ui/DataTable.tsx`  
**Props:** TBD  
**Notes:**
- Sortable columns
- Row hover state
- Clickable rows
- Link-style IDs

---

## Form Components

### Input
**Status:** 🔄 In Progress  
**Notes:** Using shadcn/ui, customized to match design system

### Button
**Status:** 🔄 In Progress  
**Variants:** primary, secondary, ghost, create  
**Notes:** Using shadcn/ui, customized to match design system

### Dropdown
**Status:** 🔄 In Progress  
**Notes:** Using shadcn/ui

---

## Template

```markdown
### ComponentName
**Status:** ✅ | 🔄 | ⚠️  
**Location:** `src/components/...`  
**Props:**
\`\`\`typescript
interface Props {
  // ...
}
\`\`\`
**Specs:**
- Key measurements
- Colors
- Behaviors
**Notes:** Any issues or considerations
```
