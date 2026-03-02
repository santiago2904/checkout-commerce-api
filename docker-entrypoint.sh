#!/bin/sh
# Docker entrypoint script for running migrations, seeds, and starting the app

set -e  # Exit on error

echo "🚀 Starting application initialization..."

# Function to check if database is ready
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if node -e "
      const { Client } = require('pg');
      const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      });
      client.connect()
        .then(() => { client.end(); process.exit(0); })
        .catch(() => { process.exit(1); });
    " 2>/dev/null; then
      echo "✅ Database is ready!"
      return 0
    fi
    
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts - Database not ready yet, retrying in 2s..."
    sleep 2
  done
  
  echo "❌ Database connection timeout after $max_attempts attempts"
  exit 1
}

# Wait for database to be ready
wait_for_db

# Run migrations
echo ""
echo "📦 Running database migrations..."
if npm run migration:run:prod 2>&1; then
  echo "✅ Migrations completed successfully!"
else
  echo "⚠️  Migrations failed or no migrations to run"
  # Don't exit - migrations might already be applied
fi

# Run seeders
echo ""
echo "🌱 Running database seeders..."
if npm run seed:run:prod 2>&1; then
  echo "✅ Seeders completed successfully!"
else
  echo "⚠️  Seeders failed or data already exists"
  # Don't exit - seeders might fail if data already exists
fi

# Start the application
echo ""
echo "🎯 Starting NestJS application..."
exec node dist/main
