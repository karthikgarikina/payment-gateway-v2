#!/bin/sh
set -e

echo "⏳ Waiting for database..."
sleep 5

echo "📦 Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
node prisma/seed.js || true

echo "🚀 Starting API..."
exec node src/server.js
