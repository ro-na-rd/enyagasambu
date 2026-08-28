#!/bin/bash
# E-Nyagasambu Production Deployment Script
# Run this on a fresh server with Docker and Docker Compose installed

set -e

echo "=== E-Nyagasambu Production Deployment ==="

# 1. Check prerequisites
echo "[1/7] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not installed"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "ERROR: Docker Compose not installed"; exit 1; }

# 2. Create .env from template if it doesn't exist
echo "[2/7] Setting up environment..."
if [ ! -f .env ]; then
  cp .env.prod.example .env
  echo "Created .env from .env.prod.example — edit it with your production values before starting!"
  echo "Required: JWT_SECRET, MYSQL_ROOT_PASSWORD, SMTP credentials, API keys"
  exit 1
fi

# 3. Validate critical env vars
echo "[3/7] Validating environment variables..."
set -a
source .env
set +a

if [ "$JWT_SECRET" = "change_to_64_char_hex_random_string_min_32_chars" ] || [ -z "$JWT_SECRET" ]; then
  echo "ERROR: Set a strong JWT_SECRET in .env (64+ random characters)"
  echo "  Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  exit 1
fi
if [ "$MYSQL_ROOT_PASSWORD" = "change_to_strong_32_char_random" ] || [ -z "$MYSQL_ROOT_PASSWORD" ]; then
  echo "ERROR: Set a strong MYSQL_ROOT_PASSWORD in .env"
  exit 1
fi
if [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
  echo "WARNING: SMTP_USER and SMTP_PASS are not set. Email notifications will not work."
fi
if [ -z "$AT_API_KEY" ] || [ -z "$AT_USERNAME" ]; then
  echo "WARNING: AT_API_KEY and AT_USERNAME are not set. SMS notifications will not work."
fi

# 4. Build Docker images (production overlay)
echo "[4/7] Building Docker images (production)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 5. Start services
echo "[5/7] Starting services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Wait for health checks
echo "[6/7] Waiting for services to be healthy..."
sleep 15
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 7. Done
DOMAIN=$(grep -oP '(?<=FRONTEND_URL=https?://)[^/]+' .env 2>/dev/null || echo "your-domain.com")
echo ""
echo "=== Deployment Complete ==="
echo "Frontend:    https://${DOMAIN}"
echo "Backend API: https://${DOMAIN}/api/health"
echo ""
echo "Next steps:"
echo "  1. Point your domain DNS to this server's IP"
echo "  2. Ensure ports 80 and 443 are open in your firewall"
echo "  3. Caddy will automatically obtain HTTPS certificates"
echo "  4. To view logs: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
