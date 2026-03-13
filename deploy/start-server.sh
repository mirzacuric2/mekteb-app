#!/bin/sh
set -e

cd /app/server
echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run prisma:seed

echo "Starting API..."
node dist/index.js
