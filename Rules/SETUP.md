# Pixel Rank CRM - Setup Guide

## Prerequisites

1. **Node.js** (v18 or later)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **PostgreSQL** (v14 or later)
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, remember your postgres password

## Quick Start

### 1. Install PostgreSQL

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password: `RedCar2025!!` (or update it in `server/.env`)
4. Keep default port: `5432`
5. Complete the installation

### 2. Create Database

Open **SQL Shell (psql)** or **pgAdmin 4** and run:

```sql
CREATE DATABASE pixelrankcrm;
```

Or using command line:
```bash
createdb -U postgres pixelrankcrm
```

### 3. Install Dependencies

Once Node.js is installed, open terminal in the project folder and run:

```bash
# Install server dependencies (if needed)
cd C:\DATA\ChatGPT\server
npm install

# Go back to project root
cd C:\DATA\ChatGPT
```

### 4. Set Up Database

```bash
# Navigate to server folder
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npm run seed
```

### 5. Start the Server

```bash
# Still in the server folder
npm run start:dev
```

The server will start on http://localhost:3001

## Default Login Credentials

After seeding the database, you can log in with:

- **Email:** admin@pixelrank.com
- **Password:** admin123

## Environment Variables

The server uses these environment variables (already configured in `server/.env`):

```
DATABASE_URL="postgresql://postgres:RedCar2025!!@localhost:5432/pixelrankcrm"
JWT_SECRET="your-secret-key-change-in-production"
```

## Testing the API

You can test the API using curl or any API client:

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pixelrank.com","password":"admin123"}'
```

### Get Companies (requires auth token)
```bash
curl http://localhost:3001/companies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Available Scripts

### Server
- `npm run start:dev` - Start server in development mode with auto-reload
- `npm run build` - Build the TypeScript code
- `npm run start` - Start the production server
- `npm run seed` - Seed the database with sample data

## Database Management

### View Database
```bash
npx prisma studio
```
This opens a visual database browser at http://localhost:5555

### Reset Database
```bash
npx prisma migrate reset
```
This will drop the database, recreate it, run migrations, and seed data.

## Troubleshooting

### PostgreSQL Connection Issues
- Verify PostgreSQL is running
- Check the DATABASE_URL in `.env` matches your setup
- Ensure database `pixelrankcrm` exists

### Port Already in Use
- Server runs on port 3001 by default
- Change in `src/main.ts` if needed

### Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Check database connection
npx prisma db push
```

## Next Steps

1. Install and set up the React frontend (client folder)
2. Configure Metronic theme
3. Connect frontend to backend API
4. Deploy to production environment
