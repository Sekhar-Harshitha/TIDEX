# TideX Team Onboarding (Post-Merge)

This document is the central context for teammates after merging this branch.

## Project Layout

1. Admin web app: apps/admin-web
2. Mobile app: apps/mobile
3. Backend API: services/backend

## What Changed

1. The mobile module path was renamed from apps/student-mobile to apps/mobile.
2. Backend no longer supports mock mode and now requires a real PostgreSQL connection.
3. Frontend startup is strict-port to avoid silent port hopping.
4. Local DB helper scripts were added to root package.json.

## One-Time Setup

1. Install dependencies:
   npm run install:all
2. Create env files from examples:
   - services/backend/.env.example -> services/backend/.env
   - apps/admin-web/.env.example -> apps/admin-web/.env
   - apps/mobile/.env.example -> apps/mobile/.env

## Local Database (Windows, no Docker)

Prerequisite: PostgreSQL binaries available in default path or set PG_BIN.

1. Initialize and start local DB cluster:
   npm run db:init:local
2. Check status:
   npm run db:status:local
3. Stop DB when needed:
   npm run db:stop:local

Default local DB values from script:

1. Host: localhost
2. Port: 55432
3. User: postgres
4. Database: tidex
5. Data dir: services/backend/.demo-pg-data

Set backend DATABASE_URL accordingly:

DATABASE_URL=postgresql://postgres@localhost:55432/tidex

## Run All Modules

Open three terminals from repo root.

1. Backend:
   npm run dev:backend
2. Admin web:
   npm run dev:web
3. Mobile (Expo):
   npm run dev:mobile

## Smoke Checks

1. Backend health:
   Invoke-RestMethod http://localhost:3001/api/health | ConvertTo-Json -Compress
2. Web app opens on configured VITE_WEB_PORT (default 5173).
3. Mobile Metro starts and shows Expo QR.
4. Signup/login/report flows persist through backend DB.
