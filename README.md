# TideX Disaster Hazard Detection Platform

This repository is now split into three independently runnable modules:

1. Admin web app: apps/admin-web
2. Mobile app: apps/mobile
3. Backend API: services/backend

Central teammate onboarding guide:

1. docs/TEAM_ONBOARDING.md

## Quick Setup

Prerequisites:

1. Node.js 20+
2. npm 10+
3. PostgreSQL (required, backend no longer allows mock/fallback mode)

Install all module dependencies:

```bash
npm run install:all
```

Initialize local DB (Windows, no Docker):

```bash
npm run db:init:local
```

## Run Modules Separately

Run backend API:

```bash
npm run dev:backend
```

Run admin web app:

```bash
npm run dev:web
```

Run mobile app (Expo):

```bash
npm run dev:mobile
```

## Environment Files

Create module environment files from examples:

1. services/backend/.env.example
2. apps/admin-web/.env.example
3. apps/mobile/.env.example

Minimum demo env values:

1. Backend: PORT=3001
2. Backend: JWT_SECRET set
3. Backend: DATABASE_URL set
4. Admin web: VITE_API_BASE_URL=http://localhost:3001
5. Admin web: VITE_WEB_PORT=5173 (or any free port)

## Demo Readiness Checklist

1. Start a real PostgreSQL instance.
2. Ensure services/backend/.env contains DATABASE_URL.
3. Start backend and confirm logs show database initialization success.
4. Start web app and confirm it binds to the configured VITE_WEB_PORT.
5. Login/signup and validate data persists across restart.

Quick local PostgreSQL via Docker:

```bash
docker run --name tidex-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tidex -p 5432:5432 -d postgres:16
```

If Docker daemon is unavailable, bootstrap a local project cluster with installed PostgreSQL tools:

```bash
"C:\\Program Files\\PostgreSQL\\18\\bin\\initdb.exe" -D services/backend/.demo-pg-data -A trust -U postgres
"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe" -D services/backend/.demo-pg-data -l services/backend/.demo-pg.log -o "-p 55432" start
"C:\\Program Files\\PostgreSQL\\18\\bin\\createdb.exe" -h localhost -p 55432 -U postgres tidex
```

Then set:

```bash
DATABASE_URL=postgresql://postgres@localhost:55432/tidex
```

Sample backend .env:

```bash
PORT=3001
JWT_SECRET=tidex-super-secret-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tidex
CORS_ORIGINS=http://localhost:5173,http://localhost:19006
```

## Architecture Notes

1. Admin web uses Vite and proxies /api calls to backend on port 3001 by default.
2. Backend server entry is services/backend/server.ts and runs independently from web.
3. Mobile app remains Expo-based and can run independently from both web and backend.
