# Apexio Timer

Developer team time tracking — built with Next.js 14, PostgreSQL, Prisma ORM, and NextAuth.js.

## Features

- **Three roles**: Admin, Dev, Viewer — each with scoped access
- **Time entry logging** — date, hours (decimal), project, client, sprint, task, description, billable toggle
- **Dashboard** — weekly/monthly summary, recent entries with inline edit/delete
- **Reports** — group by project/client/sprint/user, export CSV
- **Admin panel** — manage users, projects, clients, sprints, tasks, webhooks
- **REST API v1** — Bearer token auth, rate limiting, OpenAPI/Swagger docs at `/api/docs`
- **Webhooks** — notify external tools (Jira, Slack, Linear) on new time entries
- **Dark mode** — respects system preference

## Quick Start (Local)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/apexio_timer"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start the database (Docker)

```bash
docker compose up -d
```

Or use an existing PostgreSQL instance and create the database:

```sql
CREATE DATABASE apexio_timer;
```

### 4. Run migrations and seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Demo accounts:

| Email            | Password    | Role   |
|------------------|-------------|--------|
| admin@demo.com   | password123 | Admin  |
| dev1@demo.com    | password123 | Dev    |
| dev2@demo.com    | password123 | Dev    |
| viewer@demo.com  | password123 | Viewer |

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## REST API

Base URL: `/api/v1/`
Auth: `Authorization: Bearer <token>`

Generate a token in **Settings → API Tokens**.

| Method | Path                    | Description         |
|--------|-------------------------|---------------------|
| GET    | `/api/v1/time-entries`  | List time entries   |
| POST   | `/api/v1/time-entries`  | Create time entry   |
| GET    | `/api/v1/projects`      | List projects       |
| GET    | `/api/v1/clients`       | List clients        |
| GET    | `/api/v1/sprints`       | List sprints        |
| GET    | `/api/v1/tasks`         | List tasks          |

Full interactive docs at `/api/docs`.
Rate limit: 100 requests/minute per token.

```bash
curl -X POST http://localhost:3000/api/v1/time-entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-04-28T09:00:00Z","hours":3.5,"projectId":"ID","billable":true}'
```

## Webhooks

Configure in **Admin → Webhooks**. Events: `time_entry.created`, `time_entry.updated`, `time_entry.deleted`.
Payloads are HMAC-signed with `X-ApexioTimer-Signature` when a secret is set.

## Deploy to Vercel

1. Push repo to GitHub and import in Vercel
2. Set environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
3. Add a build command: `prisma migrate deploy && next build`

Recommended databases: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app).

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Protected routes (sidebar layout)
│   │   ├── dashboard/   # Stats + recent entries
│   │   ├── log/         # Log time form
│   │   ├── projects/    # Project management
│   │   ├── clients/     # Client management
│   │   ├── reports/     # Filterable reports + CSV export
│   │   ├── users/       # Admin: user management
│   │   ├── webhooks/    # Admin: webhook config
│   │   └── settings/    # API tokens + profile
│   ├── api/
│   │   ├── auth/        # NextAuth handler
│   │   ├── v1/          # Public REST API
│   │   └── docs/        # OpenAPI spec + Swagger UI
│   └── login/
├── components/
│   ├── ui/              # Button, Input, Select, Dialog, Badge
│   └── ...              # Feature components
└── lib/
    ├── auth.ts          # NextAuth + credentials provider
    ├── db.ts            # Prisma client (pg adapter)
    ├── api-auth.ts      # Bearer token validation
    ├── rate-limit.ts    # In-memory rate limiter
    ├── webhooks.ts      # Webhook dispatcher (HMAC signing)
    └── utils.ts
```
