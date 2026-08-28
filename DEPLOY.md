# E-Nyagasambu Deployment Guide

## Prerequisites
- Docker and Docker Compose v2+
- A server with at least 2GB RAM
- A domain name pointed to your server's IP

## Quick Deploy

```bash
# 1. Clone the repo
git clone <repo-url> && cd enyagasambu-main

# 2. Create production .env from template
cp .env.prod.example .env
# Edit .env with your production values (see below)

# 3. Run the deploy script
chmod +x deploy.sh
./deploy.sh
```

## Required Environment Variables

Edit `.env` in the project root:

| Variable | Description | Example |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | Strong MySQL root password | `your_secure_password` |
| `JWT_SECRET` | 64+ char random string | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `CLIENT_URL` | Frontend domains (comma-separated) | `https://enyagasambu.rw,https://www.enyagasambu.rw` |
| `FRONTEND_URL` | Primary frontend URL | `https://enyagasambu.rw` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://enyagasambu.rw/api` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL (public) | `https://enyagasambu.rw` |
| `S3_PUBLIC_URL` | Public URL for uploaded images | `https://enyagasambu.rw/minio/nmo-images` |
| `SMTP_USER` | Email for sending OTPs | `noreply@enyagasambu.rw` |
| `SMTP_PASS` | Email app password | `your_app_password` |
| `AT_API_KEY` | Africa's Talking API key | `your_key` |
| `AT_USERNAME` | Africa's Talking username | `your_username` |
| `MOMO_ENV` | MoMo environment (`sandbox`/`production`) | `sandbox` |
| `MOMO_SUBSCRIPTION_KEY` | MTN MoMo API key | `your_key` |
| `MOMO_USER_ID` | MTN MoMo user UUID | `your_uuid` |
| `MOMO_API_KEY` | MTN MoMo API key | `your_key` |
| `MINIO_ROOT_USER` | MinIO root username | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIO root password | `your_minio_password` |

## HTTPS Setup

The production deployment uses **Caddy** (included in `docker-compose.prod.yml`) for automatic HTTPS:
- `enyagasambu.rw` → frontend (port 3000)
- `/api/*` → backend (port 5000)
- `www.enyagasambu.rw` → redirects to `enyagasambu.rw`

If you prefer nginx, see the Caddyfile for the routing logic and configure nginx accordingly.

## Useful Commands

```bash
# View logs (production)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend

# Restart services
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Stop everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Rebuild after code changes
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check health
curl -k https://enyagasambu.rw/api/health
```

## Security Checklist

- [ ] Rotate ALL secrets (JWT, DB, API keys) if they were in git history
- [ ] Generate a strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Set `MOMO_ENV=sandbox` for testing, `production` for live payments
- [ ] Ensure ports 80 and 443 are open in your firewall
- [ ] Point domain DNS to your server's IP
- [ ] Configure automated backups for MySQL and MinIO
- [ ] Verify HTTPS is working after Caddy obtains certificates
