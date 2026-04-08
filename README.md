# TideX Disaster Hazard Detection Platform

This repository is now split into three independently runnable modules:

1. Admin web app: apps/admin-web
2. Student mobile app: apps/student-mobile
3. Backend API: services/backend

## Quick Setup

Prerequisites:

1. Node.js 20+
2. npm 10+
3. PostgreSQL (optional for demo, backend supports mock mode when DATABASE_URL is missing)

Install all module dependencies:

```bash
npm run install:all
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

Run student mobile app (Expo):

```bash
npm run dev:mobile
```

## Environment Files

Create module environment files from examples:

1. services/backend/.env.example
2. apps/admin-web/.env.example
3. apps/student-mobile/.env.example

Minimum demo env values:

1. Backend: PORT=3001
2. Backend: JWT_SECRET set
3. Admin web: VITE_API_BASE_URL=http://localhost:3001

## Architecture Notes

1. Admin web uses Vite and proxies /api calls to backend on port 3001 by default.
2. Backend server entry is services/backend/server.ts and runs independently from web.
3. Mobile app remains Expo-based and can run independently from both web and backend.
