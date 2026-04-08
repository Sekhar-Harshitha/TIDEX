# TideX 1-Hour Demo Runbook

## Goal

Run a stable demo without waiting for teammate branch integration.

## Non-Conflicting Deliverables Added

- Real SOS backend ingestion endpoint:
  - `POST /api/sos`
  - `GET /api/sos/recent`
- Readiness endpoint:
  - `GET /api/health`
- Database bootstrap improved:
  - `reports` and `sos_messages` tables auto-created
- Smoke test script:
  - `scripts/demo-sos-smoke.ps1`

## Quick Start (Presenter Machine)

1. Start app server in root:
- `npm install`
- `npm run dev`

2. Verify backend is alive:
- Open `http://localhost:3000/api/health`

3. Run SOS smoke check:
- `powershell -ExecutionPolicy Bypass -File .\scripts\demo-sos-smoke.ps1`

4. Prepare mobile demo talking points:
- Show app can work offline BLE-first and sync once internet returns.
- Show backend receives SOS via `/api/sos`.

## What To Demo If Teammate Push Is Delayed

1. Stable auth and profile flow.
2. OTP send/verify simulation.
3. Live SOS ingestion pipeline from backend side using smoke script.
4. Mesh architecture and foreground-service plan from:
- `mobile/android/REAL_BLE_MESH_SETUP.md`

## Rollback Safety

All new demo helpers are additive.
- New files under `scripts/` and `DEMO_RUNBOOK_1H.md`
- New API routes in `server.ts`

No existing core frontend modules were removed.
