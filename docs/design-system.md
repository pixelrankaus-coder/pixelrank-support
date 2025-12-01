# Pixel Rank CRM Design System

> Reference document for consistent UI implementation. Claude Code should read this before implementing any screen.

---

## 1. Color Tokens

### Primary Palette
```css
--color-primary: #6366f1;           /* Indigo - primary actions */
--color-primary-hover: #4f46e5;     /* Darker indigo on hover */
--color-primary-light: #eef2ff;     /* Light indigo backgrounds */

--color-accent: #14b8a6;            /* Teal - CTA buttons */
--color-accent-hover: #0d9488;      /* Darker teal on hover */
```

### Sidebar
```css
--sidebar-bg: #1e1b4b;              /* Dark indigo */
--sidebar-icon: #a5b4fc;            /* Light indigo icons */
--sidebar-icon-active: #ffffff;     /* White when active */
--sidebar-highlight: #4338ca;       /* Active item background */
```

### Semantic Colors
```css
--color-success: #22c55e;           /* Green - positive, open status */
--color-warning: #f59e0b;           /* Amber - on hold, attention */
--color-danger: #ef4444;            /* Red - overdue, negative */
--color-neutral: #6b7280;           /* Gray - neutral states */
```

### Backgrounds & Borders
```css
--bg-page: #f8fafc;                 /* Light gray page background */
--bg-card: #ffffff;                 /* White cards */
--bg-hover: #f1f5f9;                /* Row/item hover */
--border-light: #e2e8f0;            /* Card borders, dividers */
--border-input: #cbd5e1;            /* Input borders */
```

### Text
```css
--text-primary: #1e293b;            /* Headings, primary text */
--text-secondary: #64748b;          /* Labels, secondary info */
--text-muted: #94a3b8;              /* Placeholders, hints */
--text-link: #6366f1;               /* Links */
```

---

## 2. Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Scale
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | 20px | 600 | text-primary |
| Section heading | 14px | 600 | text-primary |
| Body text | 14px | 400 | text-primary |
| Label | 12px | 500 | text-secondary |
| Small/caption | 12px | 400 | text-muted |
| Table header | 12px | 600 | text-secondary |
| Table cell | 14px | 400 | text-primary |
| Stat number | 32px | 700 | text-primary |

---

## 3. Spacing System

Use 4px base unit:
```
4px  (xs)   - tight spacing, icon padding
8px  (sm)   - between related items
12px (md)   - component internal padding
16px (lg)   - card padding, section gaps
24px (xl)   - between sections
32px (2xl)  - major section separation
```

---

## 4. Component Patterns

### Cards
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
```

### Buttons

**Primary (CTA)**
```css
.btn-primary {
  background: var(--color-accent);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
}
```

**Secondary (Outline)**
```css
.btn-secondary {
  background: white;
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 6px;
}
```

**Dropdown Button**
```css
.btn-dropdown {
  background: var(--color-primary);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

### Status Pills
```css
.status-pill {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-open { color: #22c55e; background: #f0fdf4; }
.status-pending { color: #f59e0b; background: #fffbeb; }
.status-closed { color: #6b7280; background: #f3f4f6; }
```

### Filter Pills (Tabs)
```css
.filter-pill {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  color: var(--text-secondary);
}

.filter-pill.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
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
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-page);
}

.table td {
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-light);
}

.table tr:hover {
  background: var(--bg-hover);
}
```

### Input Fields
```css
.input {
  padding: 8px 12px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input-with-icon {
  padding-left: 36px; /* room for icon */
}
```

### Radio Button Group
```css
.radio-group {
  display: flex;
  gap: 16px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-primary);
}
```

### Stat Card
```css
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}
```

### CSAT Donut
- Circular progress ring
- Percentage in center (large, bold)
- "CSAT" label below percentage
- Legend items: Positive (green), Neutral (amber), Negative (red)

### Dropdown Menu
```css
.dropdown-menu {
  background: white;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 8px 0;
  min-width: 160px;
}

.dropdown-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--bg-hover);
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
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
```

---

## 5. Layout Patterns

### Sidebar Navigation
- Width: 56px (collapsed, icons only)
- Dark indigo background
- Icon size: 20px
- Vertical icon stack with 8px gaps
- Active indicator: lighter background + white icon
- Bottom section: settings, overflow menu

### Top Header
- Height: 56px
- White background
- Left: Page title
- Right: Search input, Create dropdown, notification icons, avatar
- Bottom border: 1px solid border-light

### Page Container
```css
.page-container {
  padding: 24px;
  max-width: 1400px;
}
```

### Two-Column Stats Row
```css
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
```

---

## 6. Icons

Use **Lucide React** icons throughout:
```
Home, Ticket, MessageSquare, Users, Calendar, Settings, 
Search, Bell, Plus, ChevronDown, Filter, Columns,
Clock, AlertCircle, CheckCircle, X, MoreVertical
```

Size: 16px for inline, 20px for navigation, 24px for empty states.

---

## 7. Interaction States

### Hover
- Buttons: Darken background 10%
- Table rows: Apply bg-hover
- Links: Underline

### Focus
- Inputs: Primary color ring (3px)
- Buttons: Primary color ring (2px offset)

### Loading
- Use skeleton loaders for cards
- Spinner for buttons (replace text)

### Empty State
- Centered illustration (optional)
- Heading: "No tickets found"
- Subtext: Explain why / what to do
- Optional CTA button

---

## 8. Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

- Sidebar: Collapse to icons on tablet, hide on mobile with hamburger
- Stats row: Stack vertically on mobile
- Table: Horizontal scroll on mobile
