#!/bin/bash
set -e

PORTS=(3000 5173)

free_port() {
  local port=$1
  echo "Checking port $port..."
  local PID
  PID=$(powershell -NoProfile -Command "
    \$conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if (\$conn) { \$conn.OwningProcess | Select-Object -First 1 } else { '' }
  " 2>/dev/null | tr -d '\r\n ')

  if [[ -n "$PID" && "$PID" =~ ^[0-9]+$ && "$PID" -gt 0 ]]; then
    echo "  Killing PID $PID on port $port..."
    taskkill //F //PID "$PID" 2>/dev/null && echo "  Port $port freed." || echo "  Warning: could not kill PID $PID."
  else
    echo "  Port $port is free."
  fi
}

for port in "${PORTS[@]}"; do
  free_port "$port"
done

# ── PostgreSQL ────────────────────────────────────────────────────────────────
echo ""
echo "Checking PostgreSQL..."
if ! docker compose ps postgres 2>/dev/null | grep -q "running"; then
  echo "  Starting PostgreSQL container..."
  docker compose up -d postgres
  echo "  Waiting for PostgreSQL to be ready..."
  until docker compose exec -T postgres pg_isready -U postgres -q 2>/dev/null; do
    sleep 1
  done
  echo "  PostgreSQL is ready."
else
  echo "  PostgreSQL already running."
fi

# ── Apply schema (idempotent: only if AtomicAsset table does not exist) ───────
echo ""
echo "Checking database schema..."
TABLE_EXISTS=$(docker compose exec -T postgres psql -U postgres -d castleinventoryax -tAc \
  "SELECT 1 FROM information_schema.tables WHERE table_name='AtomicAsset' AND table_schema='public';" 2>/dev/null || true)

if [[ "$TABLE_EXISTS" != "1" ]]; then
  echo "  Schema not found — applying db/schema.sql..."
  docker compose exec -T postgres psql -U postgres -d castleinventoryax < db/schema.sql
  echo "  Schema applied."
else
  echo "  Schema already present."
fi

# ── Start backend (.NET) and frontend (Vite) ──────────────────────────────────
echo ""
echo "Starting CastleInventoryAX..."
echo "  Backend  → http://localhost:3000"
echo "  Frontend → http://localhost:5173"
echo ""

dotnet run --project backend-dotnet &
BACKEND_PID=$!
sleep 2

npm --prefix client run dev &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
