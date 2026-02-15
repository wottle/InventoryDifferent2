#!/bin/sh
# Wait for Postgres to be ready (handled by depends_on condition in docker-compose, but extra check doesn't hurt)

# Run Prisma migrations (safe for production - only applies pending migrations)
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client (in case it wasn't generated during build)
echo "Generating Prisma Client..."
npx prisma generate

# Start the application
echo "Starting Application..."
npx ts-node -T src/index.ts
