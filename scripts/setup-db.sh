#!/bin/bash
# Post-deployment script to run database migrations
# Run this after your first deployment

echo "🗄️  Running database migrations..."
pnpm drizzle-kit push

echo "✅ Database setup complete!"
