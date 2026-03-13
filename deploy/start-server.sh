#!/bin/sh
set -e

cd /app/server
echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run prisma:seed

echo "Starting API..."
if [ -f "dist/src/index.js" ]; then
  node dist/src/index.js
elif [ -f "dist/index.js" ]; then
  node dist/index.js
else
  echo "Build output not found. Expected dist/src/index.js or dist/index.js"
  exit 1
fi
