# E-Nyagasambu Deployment Guide

## Prerequisites
- Docker and Docker Compose v2+
- A server with at least 2GB RAM
- A domain name pointed to your server's IP

## Quick Deploy

```bash
# 1. Clone the repo
git clone <repo-url> && cd enyagasambu-main

# 2. Create production .env
cp .env.example .env
# Edit .env with your production values (see below)

# 3. Run the deploy script
chmod +x deploy.sh
./deploy.sh
```

## Required Environment Variables

Edit `.env` in the project root:

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | 64+ char random string | `openssl rand -hex 32` |
| `DB_PASSWORD` | Strong MySQL password | `your_secure_password` |
| `CLIENT_URL` | Frontend domains (comma-separated) | `https://enyagasambu.rw,https://www.enyagasambu.rw` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.enyagasambu.rw/api` |
| `SMTP_USER` | Email for sending OTPs | `noreply@enyagasambu.rw` |
| `SMTP_PASS` | Email app password | `your_app_password` |
| `AT_API_KEY` | Africa's Talking API key | `your_key` |
| `MOMO_SUBSCRIPTION_KEY` | MTN MoMo API key | `your_key` |

## HTTPS Setup (nginx)

```nginx
server {
    listen 80;
    server_name enyagasambu.rw www.enyagasambu.rw;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name enyagasambu.rw www.enyagasambu.rw;

    ssl_certificate /etc/letsencrypt/live/enyagasambu.rw/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/enyagasambu.rw/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.enyagasambu.rw;

    ssl_certificate /etc/letsencrypt/live/enyagasambu.rw/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/enyagasambu.rw/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart

# Stop everything
docker compose down

# Rebuild after code changes
docker compose build --no-cache && docker compose up -d

# Check health
curl http://localhost:5000/api/health
```

## Security Checklist

- [ ] Rotate ALL secrets (JWT, DB, API keys) — they were in git history
- [ ] Set `MOMO_ENV=sandbox` for testing, `production` for live payments
- [ ] Enable HTTPS via nginx/Caddy
- [ ] Set up firewall (only open ports 80, 443, 22)
- [ ] Configure automated backups for MySQL and MinIO
