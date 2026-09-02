# Environments

The platform is configured entirely through environment variables. Copy
`backend/.env.example` → `backend/.env` and fill in real values. Frontend
runtime config lives in `frontend/.env` (see `frontend/README.md`).

## Backend variables

| Variable               | Example                        | Notes                                        |
| ---------------------- | ------------------------------ | -------------------------------------------- |
| `PORT`                 | `5000`                         | Express + Socket.IO listen port              |
| `NODE_ENV`             | `development`                  | `production` hides 500 details               |
| `CLIENT_URL`/`FRONTEND_URL` | `http://localhost:3000`    | CORS + notification links                    |
| `DB_HOST`              | `127.0.0.1`                    | Local dev uses `3307` (nmo-mysql container)  |
| `DB_PORT`              | `3307`                         |                                              |
| `DB_USER`              | `root`                         |                                              |
| `DB_PASSWORD`          | `rootpassword`                 | Never commit this                           |
| `DB_NAME`              | `nmo_db`                       |                                              |
| `DB_POOL_LIMIT`        | `10`                           | mysql2 connection pool                       |
| `JWT_SECRET`           | (random ≥32 chars)             | Used to sign auth tokens                     |
| `JWT_EXPIRES_IN`       | `7d`                           |                                              |
| `SMTP_*`               | Gmail app password             | Email notifications / password reset         |
| `AT_*`                 | Africa's Talking credentials   | SMS                                          |
| `MOMO_*`               | MTN MoMo API credentials       | Mobile money payments                        |
| `S3_ENDPOINT`          | `http://localhost:9000`        | MinIO/S3 object storage                      |
| `S3_ACCESS_KEY`        | `minioadmin`                   |                                              |
| `S3_SECRET_KEY`        | `minioadmin`                   |                                              |
| `S3_BUCKET`            | `nmo-images`                   |                                              |
| `S3_REGION`            | `us-east-1`                    |                                              |
| `S3_PUBLIC_URL`        | `http://localhost:9000/nmo-images` | Public base URL for stored files          |

## Local reference stack

| Service   | Host:Port            | Notes                              |
| --------- | -------------------- | ---------------------------------- |
| Backend   | `http://localhost:5000` | `npm start` in `backend/`         |
| Frontend  | `http://localhost:3000` | `npm run dev` in `frontend/`      |
| MariaDB   | `127.0.0.1:3307` (container `nmo-mysql`) | DB `nmo_db`       |
| MinIO     | `9000` (API), `9001` (console) | Bucket `nmo-images`             |

## Running tests

```bash
cd backend
npm run test:unit          # logger, middleware, migrations, analytics helpers
npm test                   # + DB-gated integration (auto-skip if DB down)
```

`npm test` uses `--env-file=.env`, so the DB tests run when `.env` points at a
live database and skip otherwise.

## CI

`.github/workflows/ci.yml` runs on `push`/`PR`:
- **backend**: `npm ci`, syntax-check every file under `src/`, unit tests.
- **frontend**: `npm ci`, lint, typecheck, build.

DB integration tests are excluded from CI until a MariaDB service container is
added (see ROADMAP §2).

## Migrations

```bash
cd backend
npm run migrate           # apply pending migrations
npm run migrate:status    # show applied migrations
node src/scripts/migrate.js --dry-run
node src/scripts/migrate.js --down <file.sql>   # needs a "-- @DOWN" section
npm run snapshot          # upsert today's KPI snapshot
```