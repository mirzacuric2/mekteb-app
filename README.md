# Mekteb App

Mekteb App is a monorepo for an Islamic school/community platform with role-based access for administrators and families.

## Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: React, Vite, TanStack Query, Tailwind CSS, i18next
- Infra: Docker, Docker Compose

## Core Features

- Authentication and role-based authorization (`SUPER_ADMIN`, `ADMIN`, `USER`)
- Community-scoped user and child management
- User invitation and verification flow
- Messaging between users and admins
- Posts feed with comments and reactions
- Notifications for key platform events
- Attendance tracking for lessons
- Multilingual UI support (EN, SV, BS)

## Documentation

- User docs index: `docs/README.md`
- General user guide: `docs/user-guide.md`
- Role handbooks:
  - `docs/handbooks/super-admin.md`
  - `docs/handbooks/admin.md`
  - `docs/handbooks/user.md`

## Repository Structure

```text
mekteb-app/
  server/                 # API (Express + Prisma)
  web/                    # Frontend (React + Vite)
  deploy/                 # Runtime scripts and nginx config
  docker-compose.yml      # Local development database
  docker-compose.prod.yml # Full production stack
```

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (for local PostgreSQL and compose-based deployments)

## Quick Start (Local Development)

1) Install dependencies:

```bash
npm install
```

2) Create env files:

```bash
cp server/.env.example server/.env
cp web/.env.example web/.env
```

3) Start PostgreSQL:

```bash
docker compose up -d
```

4) Generate Prisma client, run migrations, and seed:

```bash
npm run prisma:generate -w server
npm run prisma:migrate -w server
npm run prisma:seed -w server
```

5) Start API and web:

```bash
npm run dev
```

Local URLs:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`
- PostgreSQL: host port `5433`

## Environment Variables

### `server/.env`

- `PORT` (default `4000`)
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (required in non-local environments)
- `FRONTEND_URL` (web app public URL)
- SMTP values for email flow:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`

### `web/.env`

- `VITE_API_URL` (public API URL used by the frontend)

## Useful Scripts

From repository root:

- `npm run dev` - run server and web in development mode
- `npm run build` - build server and web
- `npm run lint` - run workspace lint scripts
- `npm run compose:prod:up` - run production compose stack
- `npm run compose:prod:down` - stop production compose stack

Server-specific:

- `npm run prisma:generate -w server`
- `npm run prisma:migrate -w server`
- `npm run prisma:migrate:deploy -w server`
- `npm run prisma:seed -w server`

## Deployment

### Option A (Recommended): Render

This repository includes a `render.yaml` blueprint for two services:

- API service (`Dockerfile.server`)
- Web service (`Dockerfile.web`)

Set these environment variables in Render:

- API: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, SMTP vars
- Web: `VITE_API_URL` (pointing to the API public URL)

### Option B: Docker Compose on a VPS

1) Create production env:

```bash
cp .env.production.example .env.production
```

2) Fill in secure values (`JWT_SECRET`, DB password, SMTP, domain URLs)

3) Start stack:

```bash
npm run compose:prod:up
```

4) Stop stack:

```bash
npm run compose:prod:down
```

Default compose production ports:

- Web: `8080`
- API: `4000`

### Option C: Heroku (API-first flow)

The root `Procfile` supports:

- `release`: run Prisma deploy migration and seed
- `web`: start API server

For Heroku, configure the API app env vars at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- SMTP vars

## Git Hygiene

The root `.gitignore` protects local secrets and build artifacts while keeping env templates committed.

Before each push:

```bash
git status
git diff
```
