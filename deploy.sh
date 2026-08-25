#!/bin/bash
# E-Nyagasambu Production Deployment Script
# Run this on a fresh server with Docker and Docker Compose installed

set -e

echo "=== E-Nyagasambu Production Deployment ==="

# 1. Check prerequisites
echo "[1/6] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not installed"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "ERROR: Docker Compose not installed"; exit 1; }

# 2. Create .env from template if it doesn't exist
echo "[2/6] Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it with your production values before starting!"
  echo "Required: JWT_SECRET, DB_PASSWORD, SMTP credentials, API keys"
  exit 1
fi

# 3. Validate critical env vars
source .env
if [ "$JWT_SECRET" = "generate_a_64_char_random_string_for_production" ] || [ -z "$JWT_SECRET" ]; then
  echo "ERROR: Set a strong JWT_SECRET in .env (64+ random characters)"
  exit 1
fi
if [ "$DB_PASSWORD" = "change_me_in_production" ] || [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: Set a strong DB_PASSWORD in .env"
  exit 1
fi

# 4. Build and start services
echo "[3/6] Building Docker images..."
docker compose build --no-cache

echo "[4/6] Starting services..."
docker compose up -d

# 5. Wait for health checks
echo "[5/6] Waiting for services to be healthy..."
sleep 10
docker compose ps

# 6. Run database migrations (handled by backend container on startup)
echo "[6/6] Database migrations run automatically on backend startup."
echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000/api/health"
echo "MinIO Console: http://localhost:9001"
echo ""
echo "Next steps:"
echo "  1. Set up a reverse proxy (nginx/Caddy) for HTTPS"
echo "  2. Point your domain DNS to this server"
echo "  3. Update CLIENT_URL and NEXT_PUBLIC_API_URL in .env with your domain"
echo "  4. Restart: docker compose down && docker compose up -d"
