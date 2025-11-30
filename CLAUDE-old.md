# Helpdesk Ticket System V1

## Project Overview
Single-tenant helpdesk web application - a simple Freshdesk clone.

## Tech Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database:** Prisma ORM + SQLite (dev), Postgres-ready
- **Auth:** NextAuth.js v5 (credentials provider)
- **Styling:** Tailwind CSS

## Project Structure
```
/src
  /app                 # Next.js App Router pages
    /(auth)            # Auth pages (login)
    /(dashboard)       # Protected pages (tickets, etc.)
    /api               # API routes
  /components          # Reusable UI components
  /lib                 # Utilities, db client, auth config
  /types               # TypeScript type definitions
/prisma
  schema.prisma        # Database schema
  seed.ts              # Seed script
```

## Conventions
- Use server components by default, client components only when needed
- Use server actions for mutations where possible
- Keep components simple - no premature abstraction
- Use `cn()` helper for conditional Tailwind classes

## Key Commands
```bash
npm run dev           # Start dev server
npx prisma studio     # Open database GUI
npx prisma db seed    # Seed database
npx prisma db push    # Push schema changes
```

## Default Admin
- Email: admin@helpdesk.local
- Password: admin123 (change in production!)
