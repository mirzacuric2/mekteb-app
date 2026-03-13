#!/usr/bin/env bash
set -euo pipefail

wait_for_postgres() {
  echo "==> Waiting for PostgreSQL to become ready..."
  for i in {1..30}; do
    if docker exec "mekteb_postgres" pg_isready -U "mekteb" -d "mekteb" >/dev/null 2>&1; then
      echo "==> PostgreSQL is ready"
      return 0
    fi

    if [ "$i" -eq 30 ]; then
      echo "==> PostgreSQL did not become ready in time."
      return 1
    fi

    sleep 2
  done
}

echo "==> Mekteb local bootstrap starting..."

if [ ! -f "server/.env" ]; then
  echo "==> server/.env not found, creating from template"
  cp "server/.env.example" "server/.env"
fi

if [ ! -f "web/.env" ]; then
  echo "==> web/.env not found, creating from template"
  cp "web/.env.example" "web/.env"
fi

echo "==> Installing dependencies"
npm install

echo "==> Starting PostgreSQL (docker compose)"
docker compose up -d

wait_for_postgres || {
  echo "==> Try: docker compose down -v && docker compose up -d"
  exit 1
}

echo "==> Preparing database (generate + migrate + seed)"
npm run prisma:generate -w server

set +e
MIGRATE_OUTPUT=$(npm run prisma:migrate:deploy -w server 2>&1)
MIGRATE_EXIT=$?
set -e

if [ "$MIGRATE_EXIT" -ne 0 ]; then
  echo "$MIGRATE_OUTPUT"
  if [[ "$MIGRATE_OUTPUT" == *"P1010"* ]] || [[ "$MIGRATE_OUTPUT" == *"User was denied access"* ]]; then
    echo "==> Detected DB auth mismatch (P1010). Resetting local DB volume and retrying once..."
    docker compose down -v
    docker compose up -d
    wait_for_postgres || {
      echo "==> Database did not recover after reset."
      exit 1
    }
    npm run prisma:migrate:deploy -w server
  else
    echo "==> Prisma migration failed with a non-recoverable error."
    exit 1
  fi
fi

npm run prisma:seed -w server

echo "==> Starting backend and frontend"
npm run dev
