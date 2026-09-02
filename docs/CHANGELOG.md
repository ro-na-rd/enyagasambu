# Changelog

All notable changes to the E-Nyagasambu (NMO) platform. Follows
[Keep a Changelog](https://keepachangelog.com/) loosely; versions are semantic
while pre-1.0.

## [Unreleased]

### Added
- Structured JSON-lines logger (zero dependencies, `backend/src/config/logger.js`).
- Request-ID + HTTP access logging middleware (`requestId`, `httpLogger`).
- Central error handler: multer → 400, payload-too-large → 413, bad-JSON → 400,
  otherwise 500 (details hidden in production); 404 fallback.
- `/api/health` status endpoint.
- Analytics API (admin-auth required):
  - `GET /api/analytics/overview` — date-range KPIs
  - `GET /api/analytics/trends` — daily series (users, listings, unlocks, revenue)
  - `GET /api/analytics/funnel` — 6-stage acquisition funnel
  - `GET /api/analytics/snapshots` — historical daily KPI snapshots
- `report_snapshots` table + `npm run snapshot` daily snapshot script.
- Versioned SQL migration runner (`npm run migrate`, `migrate:status`).
- Backend test suite (Node built-in `node:test`, zero new deps) — `npm test`,
  `npm run test:unit`, DB-gated integration tests.
- GitHub Actions CI (`backend` syntax+unit, `frontend` lint+typecheck+build).
- PM2 config (`backend/ecosystem.config.js`).
- `backend/.env.example` and expanded root `.gitignore`.
- Frontend `npm run typecheck` (`next typegen && tsc --noEmit`).
- Docs: `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `docs/ENVIRONMENTS.md`,
  root `AGENTS.md`, PR template.

### Fixed
- `backend/src/middleware/brokerPermissions.js` — template literal syntax error
  that prevented the module from loading.
- All 88 `console.error → logger.error` conversions now require the correct
  relative path (`config/logger` → `../config/logger` under `src/<dir>/`).
- Analytics aliases (`COUNT(*) AS c` destructured as real field names) — totals
  were serializing as `null`.
- `dayBuckets` date math normalized to UTC so trend buckets are timezone-stable.
- Migrations baselined and made idempotent:
  - `add_broker_permissions.sql` no longer contains raw `?` SQL examples.
  - `create_home_buttons.sql` / `create_team_members.sql` dedupe + upsert so
    re-runs never duplicate seed rows.
  - `add_ambassador_features.sql` no longer hardcodes `USE nmo_db;`.

### Security
- 500 responses no longer leak internal error messages in production.