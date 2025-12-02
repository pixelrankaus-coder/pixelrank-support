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

## Git Commits Reference

| Date | Branch | Commit Message |
|------|--------|----------------|
| 2025-12-02 | main | Backup before dashboard redesign |
| 2025-12-02 | feature/dashboard-redesign | Initial dashboard implementation |

---

## Screens Completed

| Screen | Status | Notes |
|--------|--------|-------|
| Dashboard | 🔄 80% | CSAT card needs polish |
| Ticket List | ⏳ Pending | |
| Ticket Detail | ⏳ Pending | |
| New Ticket | ⏳ Pending | |
| Contacts | ⏳ Pending | |
| Settings | ⏳ Pending | |

---

## Components Completed

| Component | Status | Location |
|-----------|--------|----------|
| Sidebar | 🔄 Basic | src/components/layout/ |
| Header | 🔄 Basic | src/components/layout/ |
| StatsCard | 🔄 90% | src/components/dashboard/ |
| CSATCard | ⚠️ 70% | src/components/dashboard/ |
| TicketTable | 🔄 80% | src/components/dashboard/ |
| StatusPill | 🔄 Basic | src/components/ui/ |
| Pagination | 🔄 Basic | src/components/ui/ |
