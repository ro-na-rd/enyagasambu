# E-Nyagasambu (NMO) — ROADMAP

Purpose: turn a functional-but-fragile platform into a professional, verifiable,
operationally-observable system. These items are the acceptance criteria for the
professionalization track.

## Status legend
- [x] Done
- [ ] Pending
- [~] In progress

---

## 1. Developer experience & repo hygiene
- [x] Structured JSON logging (`backend/src/config/logger.js`, zero deps)
- [x] Request-IDs + HTTP access logging (`middleware/requestId.js`, `middleware/httpLogger.js`)
- [x] Central error handler with safe responses (`middleware/errorHandler.js`)
- [x] Global `console.error` → `logger.error` conversion
- [x] Fixed the `require('config/logger')` relative-path bug (all 88 files)
- [x] Fixed the latent `brokerPermissions` template-literal syntax error
- [x] `.gitignore` covers machine-local dev helpers
- [x] `backend/.env.example` with placeholders (no real secrets)
- [x] Frontend `npm run typecheck` = `next typegen && tsc --noEmit`
- [x] Fixed all TS errors blocking `tsc --noEmit` (icon `alt`, missing consts)

## 2. Testing & CI
- [x] Zero-dependency unit tests via `node:test` (`backend/test/`)
  - logger, middleware (request-id, http-logger, error handler, 404)
  - migration helpers (`checksum`, `splitDown`, file listing)
  - analytics `dayBuckets`
- [x] DB-gated integration tests (auto-skip when DB unreachable)
  - listings regression (deleted-rows feed never 500s)
  - baseline tables present
- [x] `npm test` / `npm run test:unit` scripts (Node 20+, `--env-file=.env`)
- [x] GitHub Actions CI (`.github/workflows/ci.yml`)
  - backend: syntax-check all `src/**/*.js` + unit tests
  - frontend: lint + typecheck + build
- [ ] CI: bring up a MariaDB service container and run DB integration tests too

## 3. Database
- [x] Versioned migration runner (`backend/src/scripts/migrate.js`)
  - `schema_migrations` tracking table, sha256 checksums
  - `--status | --dry-run | --apply | --down <file>` (down via `-- @DOWN` section)
- [x] Baseline: 5 legacy migration files made idempotent + applied
  - `add_ambassador_features.sql` (created the ambassador tables)
  - `add_broker_permissions.sql` (removed raw `?` example statements)
  - `create_home_buttons.sql` / `create_team_members.sql` (dedupe + upsert)
  - `create_recycle_bin.sql`
- [x] `report_snapshots` table migration + snapshot script (`npm run snapshot`)
- [ ] Make remaining one-shot `src/scripts/migrate*` scripts idempotent and fold
      into `migrations/` or mark deprecated

## 4. Analytics
- [x] `GET /api/analytics/overview?from=&to=` — range KPIs
- [x] `GET /api/analytics/trends?from=&to=` — daily series (users, listings, unlocks, revenue)
- [x] `GET /api/analytics/funnel` — 6-stage acquisition funnel
- [x] `GET /api/analytics/snapshots?from=&to=` — historical daily KPI snapshots
- [ ] Frontend dashboard UI consuming these endpoints
- [ ] Alerting when funnel/trend KPIs cross thresholds

## 5. Operations
- [x] PM2 ecosystem config (`backend/ecosystem.config.js`)
- [ ] Health-check enrichment (DB + S3 + uptime in `/api/health`)
- [ ] Structured `--PORT` / graceful shutdown handling in `src/index.js`
- [ ] Rate-limiter audit for all auth routes

## 6. Documentation
- [x] `docs/ROADMAP.md` (this file)
- [x] `docs/CHANGELOG.md`
- [x] `docs/ENVIRONMENTS.md`
- [x] `AGENTS.md` (definition of done)
- [x] `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] Per-endpoint API reference