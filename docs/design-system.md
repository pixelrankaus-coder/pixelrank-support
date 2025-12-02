# Pixel Rank CRM Design System

> **Version:** 2.0  
> **Source:** Extracted from BoldDesk CSS  
> **Updated:** December 2025  

⚠️ **Claude Code: Read this file completely before implementing any screen.**

---

## 1. Color Tokens

### Brand Colors (Primary Purple)
```css
--brand-25: #efe8fd;
--brand-50: #ece3fd;
--brand-100: #e9defc;
--brand-200: #d9c7fa;
--brand-300: #c9aff8;
--brand-400: #b693f6;
--brand-500: #9f72f3;
--brand-600: #793aee;      /* Primary brand color */
--brand-700: #661eec;
--brand-800: #5612d3;
--brand-900: #390c8d;
--brand-950: #2e0a71;

/* Sidebar uses brand-600 */
--sidebar-theme-color: #793aee;
--theme-color: #7839ee;
```

### Semantic Colors
```css
/* Success (Green) */
--color-success: #069454;
--color-success-light: #ecfcf2;
--color-success-lighter: #aaefc6;
--color-success-text: #057647;

/* Warning (Amber/Orange) */
--color-warning: #db6803;
--color-warning-light: #fff9eb;
--color-warning-lighter: #fede88;
--color-warning-text: #b54707;

/* Danger/Error (Red) */
--color-danger: #d92c20;
--color-danger-light: #fef2f1;
--color-danger-lighter: #fecdc9;
--color-danger-text: #b32218;

/* Info (Blue) */
--color-info: #0086c9;
--color-info-light: #f0f9ff;
--color-info-lighter: #b9e6fe;
--color-info-text: #026aa2;
```

### CSAT Colors
```css
--csat-overall: #4E5BA6;
--csat-positive: #17B26A;    /* Green smile */
--csat-neutral: #DC6803;     /* Amber meh */
--csat-negative: #F04438;    /* Red frown */
```

### Text Colors
```css
--text-primary: #101828;
--text-secondary: #344054;
--text-tertiary: #475467;
--text-quaternary: #667085;
--text-placeholder: #667085;
--text-disabled: #98a1b2;
--text-white: #fff;
--text-link: #1570ef;
--text-brand: #7e56d8;
```

### Background Colors
```css
--bg-primary: #fff;
--bg-secondary: #f9fafb;
--bg-tertiary: #f2f4f7;
--bg-quaternary: #eaecf0;
--bg-hover: #f9fafb;
--bg-active: #f9fafb;
--bg-disabled: #f2f4f7;
--bg-overlay: rgba(71, 84, 103, 0.7);

/* Brand backgrounds */
--bg-brand-primary: #f9f5ff;
--bg-brand-secondary: #f4ebff;
--bg-brand-solid: #7e56d8;
--bg-brand-solid-hover: #6840c6;
```

### Border Colors
```css
--border-primary: #d0d5dd;
--border-secondary: #eaecf0;
--border-tertiary: #f2f4f7;
--border-disabled: #d0d5dd;
--border-brand: #d6bbfb;
--border-brand-solid: #7e56d8;
--border-error: #fca19b;
--border-success: #47cd89;
--border-warning: #fec84a;
```

### Foreground/Icon Colors
```css
--fg-primary: #101828;
--fg-secondary: #344054;
--fg-tertiary: #475467;
--fg-quaternary: #667085;
--fg-quinary: #98a1b2;
--fg-disabled: #98a1b2;
--fg-white: #fff;
--fg-brand: #7e56d8;
```

---

## 2. Typography

### Font Stack
```css
font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
```

### Scale
| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| Page title | 20px | 600 | text-primary | 1.4 |
| Section heading | 14px | 600 | text-primary | 1.4 |
| Body text | 14px | 400 | text-primary | 1.5 |
| Label | 12px | 500 | text-secondary | 1.4 |
| Small/caption | 12px | 400 | text-tertiary | 1.4 |
| Table header | 12px | 600 | text-secondary | 1.4 |
| Table cell | 14px | 400 | text-primary | 1.5 |
| Stat number | 32px | 700 | text-primary | 1.2 |
| Button | 14px | 500 | - | 1.4 |

### Base Font Size
```css
body {
  font-size: 14px;
}
```

---

## 3. Spacing System

Use 4px base unit:
```
4px   - xs (tight spacing, icon padding)
8px   - sm (between related items)
10px  - md (component internal padding)
12px  - md-lg
16px  - lg (card padding, section gaps)
24px  - xl (between sections)
26px  - specific (margin-right on rating sections)
32px  - 2xl (major section separation)
```

---

## 4. Border Radius
```css
--radius-sm: 4px;    /* Pills, small elements */
--radius-md: 6px;    /* Buttons, inputs */
--radius-lg: 8px;    /* Cards, dropdowns */
--radius-xl: 12px;   /* Modals, large cards */
--radius-full: 50%;  /* Avatars, circles */
```

---

## 5. Shadows
```css
/* Dropdown / Context menu */
--shadow-dropdown: 0 12px 16px -4px rgba(16, 24, 40, 0.08), 
                   0 4px 6px -2px rgba(16, 24, 40, 0.05);

/* Toast notifications */
--shadow-toast: 0px 4px 6px -2px rgba(16, 24, 40, 0.031), 
                0px 12px 16px -4px rgba(16, 24, 40, 0.078);

/* Filter/close buttons */
--shadow-subtle: 0px 1px 2px 0px rgba(16, 24, 40, 0.059), 
                 0px 1px 3px 0px rgba(16, 24, 40, 0.102);

/* Cards (subtle) */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05);
```

---

## 6. Component Patterns

### Status Pills

```css
/* Open - Green */
.status-open {
  color: #069454;
  background: #ecfcf2;
}

/* Pending - Amber */
.status-pending {
  color: #db6803;
  background: #fff9eb;
}

/* On Hold - Amber (same as pending) */
.status-on-hold {
  color: #db6803;
  background: #fef0c7;
}

/* Closed - Gray */
.status-closed {
  color: #344054;
  background: #f2f4f7;
}

/* Common pill styles */
.status-pill {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
```

### Buttons

**Primary (Brand Solid)**
```css
.btn-primary {
  background: #7e56d8;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  border: none;
}
.btn-primary:hover {
  background: #6840c6;
}
.btn-primary:active {
  background: #52379e;
}
```

**Secondary (Outline)**
```css
.btn-secondary {
  background: #fff;
  border: 1px solid #d0d5dd;
  color: #344054;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
}
.btn-secondary:hover {
  background: #f2f4f7;
}
```

**Create Button (Teal/Info style)**
```css
.btn-create {
  background: #0086c9;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.btn-create:hover {
  background: #026aa2;
}
```

### Cards
```css
.card {
  background: #fff;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  padding: 16px;
}
```

### Data Table
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #344054;
  border-bottom: 1px solid #eaecf0;
  background: #fff;
}

.table td {
  padding: 12px 16px;
  font-size: 14px;
  color: #101828;
  border-bottom: 1px solid #eaecf0;
}

.table tr:hover {
  background: #f9fafb;
}

/* Link style for IDs */
.table .link {
  color: #7e56d8;
  font-weight: 500;
}
.table .link:hover {
  color: #6840c6;
  text-decoration: underline;
}
```

### Filter Pills / Tabs
```css
.filter-pill {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  color: #667085;
  border: 1px solid transparent;
}

.filter-pill:hover {
  background: #f9fafb;
}

.filter-pill.active {
  background: #f9f5ff;
  color: #7e56d8;
  border-color: #d6bbfb;
}
```

### Input Fields
```css
.input {
  padding: 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  font-size: 14px;
  color: #101828;
  background: #fff;
}

.input::placeholder {
  color: #667085;
}

.input:focus {
  outline: none;
  border-color: #7e56d8;
  box-shadow: 0 0 0 3px rgba(126, 86, 216, 0.15);
}
```

### CSAT Card Layout

**Structure:** Horizontal row with three rating columns + donut on right

```
┌─────────────────────────────────────────────────────────────────┐
│ Customer Satisfaction (Last 30 days)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  😊 Positive    😐 Neutral     😞 Negative         ┌───────┐   │
│     0%             0%             0%               │  0%   │   │
│   0 Rating      0 Rating       0 Rating           │ CSAT  │   │
│                                                    └───────┘   │
└─────────────────────────────────────────────────────────────────┘
```

```css
.csat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.csat-ratings {
  display: flex;
  gap: 32px;
}

.csat-rating-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.csat-rating-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Emoji size */
.csat-emoji {
  width: 20px;
  height: 20px;
}

/* Labels */
.csat-label {
  font-size: 14px;
  font-weight: 500;
}
.csat-label.positive { color: #17B26A; }
.csat-label.neutral { color: #DC6803; }
.csat-label.negative { color: #F04438; }

/* Percentage */
.csat-percentage {
  font-size: 20px;
  font-weight: 600;
  color: #101828;
}

/* Subtext */
.csat-subtext {
  font-size: 12px;
  color: #667085;
}

/* Donut */
.csat-donut {
  width: 80px;
  height: 80px;
  position: relative;
}

.csat-donut-value {
  font-size: 18px;
  font-weight: 700;
  color: #101828;
}

.csat-donut-label {
  font-size: 11px;
  color: #667085;
}
```

### Dropdown Menu
```css
.dropdown-menu {
  background: #fff;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  box-shadow: 0 12px 16px -4px rgba(16, 24, 40, 0.08), 
              0 4px 6px -2px rgba(16, 24, 40, 0.05);
  padding: 8px 0;
  min-width: 160px;
}

.dropdown-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #344054;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f9fafb;
}
```

### Pagination
```css
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #eaecf0;
  background: #fff;
  color: #667085;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  background: #f9fafb;
}

.page-btn.active {
  background: #7e56d8;
  color: #fff;
  border-color: #7e56d8;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 7. Layout Patterns

### Sidebar Navigation
```css
.sidebar {
  width: 56px;
  background: #793aee;  /* brand-600 */
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.sidebar-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-icon.active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
```

### Top Header
```css
.header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #eaecf0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### Page Container
```css
.page-container {
  padding: 24px;
  background: #fff;
}
```

### Two-Column Stats Row
```css
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
```

---

## 8. Scrollbar Styling
```css
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: #d0d5dd;
  border-radius: 8px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: #98a1b2;
}

*::-webkit-scrollbar-thumb:active {
  background-color: #667085;
}
```

---

## 9. Icons

Use **Lucide React** icons throughout:
```
Home, Ticket, MessageSquare, Users, Calendar, Settings, 
Search, Bell, Plus, ChevronDown, ChevronLeft, ChevronRight,
Filter, Columns, Clock, AlertCircle, CheckCircle, X, 
MoreVertical, Info, Smile, Meh, Frown
```

**Sizes:**
- 16px — inline, small buttons
- 20px — navigation, standard buttons
- 24px — empty states, headers

---

## 10. Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1470px;  /* BoldDesk uses this for scaling */
```

**Note:** BoldDesk sets viewport to 1470px minimum and scales down on smaller screens.

---

## 11. Animation / Transitions

```css
/* Standard transition */
transition: all 0.15s ease;

/* Hover effects */
transition: background-color 0.15s ease, border-color 0.15s ease;

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}
```

---

## Quick Reference: Most Used Values

| Token | Value |
|-------|-------|
| Primary brand | `#7e56d8` |
| Primary hover | `#6840c6` |
| Sidebar bg | `#793aee` |
| Text primary | `#101828` |
| Text secondary | `#344054` |
| Text muted | `#667085` |
| Border default | `#d0d5dd` |
| Border light | `#eaecf0` |
| Background hover | `#f9fafb` |
| Success | `#069454` |
| Warning | `#db6803` |
| Error | `#d92c20` |
| Border radius | `8px` (cards), `6px` (buttons) |
| Font | Inter, 14px base |
