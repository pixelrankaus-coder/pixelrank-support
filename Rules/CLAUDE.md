# Pixel Rank CRM V2 - Project Documentation

**Last Updated:** 2025-11-23
**Status:** Backend Complete, Frontend Wired Up

## Project Overview

Full-stack multi-tenant CRM application built with NestJS backend and React frontend using Metronic Tailwind starter kit.

## Technology Stack

### Backend
- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT with Passport.js
- **Password Hashing:** bcrypt
- **Port:** 4000

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **UI Framework:** Metronic Tailwind React Starter Kit (Layout 14)
- **Routing:** React Router v6
- **Port:** 5174

## Running Services

```bash
# Backend (NestJS)
cd C:\DATA\ChatGPT\server
npm run start:dev
# → http://localhost:4000/api

# Frontend (React + Vite)
cd C:\DATA\ChatGPT\client\metronic\metronic-v9.3.6\metronic-tailwind-react-starter-kit\typescript\vite
npm run dev -- --port 5174
# → http://localhost:5174
```

## Database Schema

### Models (6 Total)

```prisma
model Tenant {
  id        String    @id @default(uuid())
  name      String
  domain    String    @unique
  createdAt DateTime  @default(now())
  users     User[]
  companies Company[]
  contacts  Contact[]
  tickets   Ticket[]
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user")
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Company {
  id        String    @id @default(uuid())
  name      String
  tenantId  String
  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  createdAt DateTime  @default(now())
  contacts  Contact[]
}

model Contact {
  id        String   @id @default(uuid())
  name      String
  email     String
  phone     String?
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}

model Ticket {
  id        String          @id @default(uuid())
  title     String
  status    String          @default("open")
  assignedToId String?
  assignedTo   User?        @relation(fields: [assignedToId], references: [id])
  tenantId  String
  tenant    Tenant          @relation(fields: [tenantId], references: [id])
  createdAt DateTime        @default(now())
  messages  TicketMessage[]
}

model TicketMessage {
  id        String   @id @default(uuid())
  content   String
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  createdAt DateTime @default(now())
}
```

## Seeded Test Data

**Tenant 1: Pixel Rank**
- Email: admin@pixelrank.com
- Password: admin123
- Domain: pixelrank.com

**Tenant 2: Cold Xpress**
- Email: admin@coldxpress.com
- Password: admin123
- Domain: coldxpress.com

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/auth/me` - Get current user info (requires JWT + TenantGuard)

### Companies
All endpoints require `AuthGuard('jwt')` + `TenantGuard`

- `GET /api/companies` - List all companies for tenant
- `GET /api/companies/:id` - Get single company
- `POST /api/companies` - Create company
  - Body: `{ "name": "string" }`
- `PUT /api/companies/:id` - Update company
  - Body: `{ "name": "string" }` (optional)
- `DELETE /api/companies/:id` - Delete company

### Contacts
All endpoints require `AuthGuard('jwt')` + `TenantGuard`

- `GET /api/contacts` - List all contacts for tenant
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create contact
  - Body: `{ "companyId": "uuid", "name": "string", "email": "string", "phone": "string?" }`
- `PUT /api/contacts/:id` - Update contact
  - Body: `{ "name"?: "string", "email"?: "string", "phone"?: "string", "companyId"?: "uuid" }`
- `DELETE /api/contacts/:id` - Delete contact

## Architecture Patterns

### Multi-Tenancy
**Critical Rule:** Every database query MUST include `tenantId` in the `where` clause

```typescript
// ✅ Correct
await this.prisma.company.findMany({
  where: { tenantId },
  orderBy: { createdAt: 'desc' },
});

// ❌ Wrong - Missing tenant isolation
await this.prisma.company.findMany({
  orderBy: { createdAt: 'desc' },
});
```

### Authentication Flow

1. User submits email/password to `POST /api/auth/login`
2. `AuthService.validateUser()` checks credentials with bcrypt
3. If valid, `AuthService.login()` generates JWT with payload:
   ```typescript
   {
     sub: user.id,      // userId
     tenantId: user.tenantId,
     role: user.role
   }
   ```
4. Client stores JWT token
5. Client includes token in `Authorization: Bearer <token>` header
6. `JwtStrategy.validate()` decodes token and attaches to `req.user`:
   ```typescript
   req.user = {
     userId: payload.sub,
     tenantId: payload.tenantId,
     role: payload.role
   }
   ```
7. `TenantGuard` verifies `req.user.tenantId` exists

### Ownership Verification Pattern

Services verify ownership before updates/deletes:

```typescript
// Example from CompanyService
async updateCompany(id: string, tenantId: string, dto: UpdateCompanyDto) {
  // First, verify company exists AND belongs to tenant
  await this.getCompanyById(id, tenantId);

  // Then perform update
  return this.prisma.company.update({
    where: { id },
    data: { ...dto },
  });
}
```

### Company Ownership for Contacts

Contacts must belong to companies within the same tenant:

```typescript
// Before creating contact, validate company ownership
const company = await this.prisma.company.findFirst({
  where: { id: dto.companyId, tenantId },
});
if (!company) {
  throw new NotFoundException('Company not found');
}
```

### Password Security

Never return passwords in API responses:

```typescript
const { password, ...safeUser } = user;
return safeUser;
```

### Global Validation

Enabled in `server/src/main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe());
```

All DTOs use class-validator decorators:
- `@IsString()`
- `@IsEmail()`
- `@IsNotEmpty()`
- `@IsOptional()`
- `@MinLength(6)`

## Frontend Architecture

### Metronic Integration Rules

**CRITICAL:** Never modify vendor code in `client/metronic/`

- **Vendor Code:** `C:\DATA\ChatGPT\client\metronic\metronic-v9.3.6\metronic-tailwind-react-starter-kit\typescript\vite\`
- **Custom App Code:** Will go in separate `client/src/` folder (to be created)
- **Layout 14:** Default layout and visual template for all CRM pages
- **Default Route:** Changed to `/layout-14` in `app-routing-setup.tsx:197`

### Current Frontend Status

- ✅ Metronic installed with `--legacy-peer-deps` (React 19 peer dependency conflict)
- ✅ Dev server running on port 5174
- ✅ Layout 14 set as default landing page
- ⏳ No API integration yet
- ⏳ No authentication context yet
- ⏳ No custom CRM pages yet

### Key Frontend Files

```
client/metronic/.../typescript/vite/
├── src/
│   ├── main.tsx                          # React entry point
│   ├── App.tsx                           # App wrapper with providers
│   ├── routing/
│   │   ├── app-routing.tsx               # Routing wrapper with loading bar
│   │   └── app-routing-setup.tsx         # Route definitions (default: /layout-14)
│   ├── components/
│   │   └── layouts/
│   │       └── layout-14/
│   │           └── index.tsx             # Layout 14 component (DO NOT MODIFY)
│   └── pages/
│       └── layout-14/
│           └── page.tsx                  # Skeleton placeholder (will replace with CRM pages)
```

## Important Backend Files

### Entry Point
- `server/src/main.ts` - Bootstrap, global ValidationPipe, port 4000

### Authentication Module
- `server/src/modules/auth/auth.module.ts`
- `server/src/modules/auth/auth.controller.ts` - Login endpoint, /me endpoint
- `server/src/modules/auth/auth.service.ts` - validateUser, login, getCurrentUser
- `server/src/modules/auth/auth.strategy.ts` - JWT validation
- `server/src/modules/auth/dto/login.dto.ts` - Login validation

### Tenant Module
- `server/src/modules/tenant/tenant.guard.ts` - Enforces tenantId in req.user

### Organization Module (Companies & Contacts)
- `server/src/modules/org/org.module.ts`
- `server/src/modules/org/company.controller.ts` - Company CRUD endpoints
- `server/src/modules/org/company.service.ts` - Company business logic
- `server/src/modules/org/contact.controller.ts` - Contact CRUD endpoints
- `server/src/modules/org/contact.service.ts` - Contact business logic
- `server/src/modules/org/dto/create-company.dto.ts`
- `server/src/modules/org/dto/update-company.dto.ts`
- `server/src/modules/org/dto/create-contact.dto.ts`
- `server/src/modules/org/dto/update-contact.dto.ts`

### Prisma
- `server/prisma/schema.prisma` - Database schema
- `server/prisma/seed.ts` - Test data seeding script

## Completed Steps

- ✅ Step 1-8: NestJS setup, Prisma, PostgreSQL, authentication, database seeding
- ✅ Step 9: Login validation with DTOs, real Prisma queries, TenantGuard
- ✅ Step 10: /auth/me endpoint with dual guard protection
- ✅ Step 11: Company CRUD with Prisma, DTOs, tenant isolation
- ✅ Step 12: Contact CRUD with Prisma, DTOs, company ownership validation
- ✅ Step 13: Metronic frontend wired up on port 5174
- ✅ Step 13.1: Layout 14 set as default route

## Next Steps (Not Yet Implemented)

1. **Create Custom App Folder Structure**
   - `client/src/` for all custom CRM code
   - Separate from Metronic vendor code

2. **Frontend API Integration**
   - Create API client/service (axios or fetch)
   - Environment variables for backend URL
   - Request/response interceptors

3. **Authentication Context**
   - Store JWT token in localStorage/sessionStorage
   - Create AuthContext/AuthProvider
   - Login/logout functionality

4. **Protected Routes**
   - Route guard component
   - Redirect to login if not authenticated

5. **CRM Pages Using Layout 14**
   - Login page
   - Companies list page
   - Company detail/edit page
   - Contacts list page
   - Contact detail/edit page

6. **Ticket Module (Deferred)**
   - Ticket CRUD endpoints
   - TicketMessage CRUD endpoints

## Common Commands

```bash
# Database
cd C:\DATA\ChatGPT\server
npx prisma migrate dev --name <migration_name>
npx prisma generate
npx prisma studio
npm run seed

# Backend
npm run start:dev      # Development mode with watch
npm run build          # Production build
npm run start:prod     # Production mode

# Frontend
npm install --legacy-peer-deps    # Install dependencies
npm run dev -- --port 5174        # Development server
npm run build                     # Production build
npm run preview                   # Preview production build
```

## Troubleshooting

### React 19 Peer Dependency Conflict
- Issue: `react-helmet-async@2.0.5` requires React 16-18
- Solution: Use `npm install --legacy-peer-deps`

### Port Already in Use
```bash
# Windows: Kill process on port
netstat -ano | findstr :4000
taskkill /PID <pid> /F
```

### Database Connection Issues
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `server/.env`
- Test connection: `psql -U postgres`

## Project Rules

See separate rule files:
- `C:\DATA\ChatGPT\PROJECT_RULES.md` - General project guidelines
- `C:\DATA\ChatGPT\METRONIC_RULES.md` - Metronic integration rules
- `C:\DATA\ChatGPT\TAILWIND_RULES.md` - Tailwind CSS guidelines

## Development Workflow

1. Always ask Claude to **review and challenge** before executing changes
2. Present options (A/B/C) with recommendations
3. Wait for explicit approval
4. Never modify Metronic vendor code
5. All custom code in separate folders
6. Always include `tenantId` in database queries
7. Verify ownership before updates/deletes
8. Never return passwords in API responses

---

**Current Session Token Usage:** Monitor with `/usage`
**Backup:** Export conversation from claude.com regularly
