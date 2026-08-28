# Hosting Guide — E-Nyagasambu

## Quick prod deploy
```bash
cp .env.prod.example .env
# edit .env — set strong MYSQL_ROOT_PASSWORD, JWT_SECRET, SMTP, S3_PUBLIC_URL, CLIENT_URL
# generate JWT: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
./deploy.sh
```

## Required prod env
- `CLIENT_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `S3_PUBLIC_URL` must be `https://yourdomain` not localhost
- `JWT_SECRET` ≥32 random chars, `MYSQL_ROOT_PASSWORD` strong, `MINIO` passwords rotated
- `SMTP_*`, `AT_*`, `MOMO_*` real production keys
- Never commit `.env` — only `.env.prod.example`

## What was fixed
- **docker-compose.yml**: Required env vars with `:?` syntax (fail-fast on missing config), healthchecks, `NODE_ENV=production`, `JWT_EXPIRES_IN`, `DB_POOL_LIMIT`
- **docker-compose.prod.yml**: Production overlay removes exposed ports, adds Caddy reverse proxy for automatic HTTPS
- **Caddyfile**: www→bare domain redirect, security headers (CSP, Permissions-Policy, XSS-Protection), JSON logging
- **backend/Dockerfile**: Non-root user (`appuser`), migration errors surface properly
- **frontend/Dockerfile**: Switched to `node:20-slim` (smaller image), non-root user
- **backend/src/index.js**: Startup env validation (fails fast on missing vars), `trust proxy` for rate limiting behind proxy, helmet mandatory (no try/catch), CORS validation
- **backend/src/config/db.js**: Connection pool tuning (`queueLimit`, `connectTimeout`, `enableKeepAlive`), configurable `DB_POOL_LIMIT`
- **backend/src/services/s3Service.js**: Removed localhost fallback for `S3_PUBLIC_URL` (requires env var)
- **backend/src/services/smsService.js**: Warning log when SMS service unavailable
- **backend/src/config/socket.js**: CORS uses comma-separated `CLIENT_URL` (consistent with Express CORS)
- **frontend/next.config.ts**: Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `X-Powered-By` hidden)
- **frontend/src/app/layout.tsx**: Full SEO metadata (OpenGraph, Twitter cards, icons, robots)
- **frontend/src/app/(auth)/login/page.tsx**: Role-based redirect after login (not hardcoded to /ambassador)
- **frontend/src/lib/api.ts, socket.ts**: Removed hardcoded localhost fallbacks (use `/api` relative path)
- **.dockerignore** files: Prevent `.env`, `node_modules`, `.git` from being copied into Docker images
- **.env.prod.example**: Complete template with all required variables documented
- **DEPLOY.md**: Updated to reference production deployment process

## Checks
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml ps` — all `healthy`/`Up`
- `curl https://yourdomain/api/health` → `{"status":"ok"}`
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend --tail 20` — no `ER_NO_SUCH_TABLE`
- Rotate exposed credentials immediately if they were in git history
