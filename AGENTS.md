# AGENTS.md — Definition of Done

Guidance for AI coding agents and human contributors working on this repo.

## Repo layout
- `backend/` — Node.js/Express API (CommonJS, `mysql2/promise`, Socket.IO).
- `frontend/` — Next.js 16 app (read `frontend/AGENTS.md` for Next.js specifics).

## Non-negotiable rules
1. **No new runtime dependencies unless required** — this dev environment has no
   npm registry access. Prefer built-ins (`node:test`, `node:assert`, `http`)
   or existing deps. If a dep is truly needed, say so and get explicit approval.
2. **Never commit secrets** — `.env` files contain real credentials and are
   gitignored. Use `backend/.env.example` with placeholders only. Before
   committing, run `git status` and confirm no `.env`/`.env.*` (non-example)
   files would be added.
3. **No comments unless they explain "why"** — mirror the existing style.
4. **Conventional commits** — `feat:`, `fix:`, `chore:`, `docs:`, `test:`,
   `refactor:` with a short imperative subject.
5. **Never `npm install` new packages silently** — registry is unreachable here;
   verify network first.

## Backend workflow
1. Log through the structured logger (`const { logger } = require('../config/logger')`),
   never `console.log`/`console.error`.
2. Relative requires are `../config/logger` from `src/<dir>/` — a bare
   `require('config/logger')` will not resolve.
3. Database changes go through the migration runner:
   - Add a numbered/dated `.sql` file in `backend/migrations/` (idempotent).
   - `npm run migrate` applies it; verify with `npm run migrate:status`.
4. Wrap controllers in try/catch; route errors to the central error handler by
   calling `next(err)` or `res.status(...).json(...)` — do not leak internals.
5. Tests: `npm test` (all), `npm run test:unit` (fast, no DB). New pure logic
   should include a unit test; anything changing schema-exposed queries should
   add a DB-gated test in `backend/test/`.

## Frontend workflow
- Follow `frontend/AGENTS.md` — it documents breaking Next.js 16 differences.
- Run `npm run lint` and `npm run typecheck` after changes; the typecheck script
  regenerates `.next/types` first so deleted-route stubs don't fail CI.

## Definition of done
- [ ] Change is scoped and matches existing file conventions
- [ ] No secrets added; `.env.example` updated if env surface changed
- [ ] Backend: `npm run test:unit` green (and `npm test` when DB is up)
- [ ] Frontend: `npm run lint` + `npm run typecheck` green
- [ ] Migrations idempotent and tested against the local DB
- [ ] CI (`.github/workflows/ci.yml`) passes — verified or clearly N/A
- [ ] Committed with a conventional-commit message; pushed when asked