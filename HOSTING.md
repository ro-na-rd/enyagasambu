# Hosting Guide — E-Nyagasambu

## Quick prod deploy
```bash
cp .env.prod.example .env
# edit .env — set strong MYSQL_ROOT_PASSWORD, JWT_SECRET, SMTP, S3_PUBLIC_URL, CLIENT_URL
# generate JWT: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
docker compose --env-file .env up -d --build
# with TLS (requires domain DNS → server IP)
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Required prod env
- `CLIENT_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `S3_PUBLIC_URL` must be `https://yourdomain` not localhost
- `JWT_SECRET` ≥32 random chars, `MYSQL_ROOT_PASSWORD` strong, `MINIO` passwords rotated
- `SMTP_*`, `AT_*`, `MOMO_*` real production keys
- Never commit `.env` — only `.env.prod.example`

## What was fixed
- `docker-compose.yml`: healthchecks (backend `/api/health`, frontend `/`), `NODE_ENV=production`, `CLIENT_URL`/`S3_PUBLIC_URL` via env, `unless-stopped` restart
- `docker-compose.prod.yml` + `Caddyfile`: automatic HTTPS via Caddy (443) reverse-proxying `enyagasambu.rw` → frontend/backend
- `backend/Dockerfile`: `wget` + auto `initDb.js` on startup (creates tables from `schema.sql` + `migrations/`)
- `frontend/Dockerfile`: `wget` for healthcheck, `NEXT_PUBLIC_SITE_URL` build arg
- `backend/src/scripts/initDb.js`: idempotent schema init
- `.env.prod.example`, `Caddyfile`, `HOSTING.md`

## Checks
- `docker ps` — all `healthy`/`Up`
- `curl https://yourdomain/api/health` → `{"status":"ok"}`
- `docker compose logs backend --tail 20` — no `ER_NO_SUCH_TABLE`
- Rotate exposed `SMTP_PASS` (was in git) immediately
```

