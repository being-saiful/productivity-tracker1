#!/bin/bash
# Migration script to add app_usage tracking

echo "===== PRODUCTIVITY TRACKER: APP USAGE TRACKING UPGRADE ====="
echo ""

# 1. Backup existing database
echo "1. Backing up existing database..."
cp data/pt.sqlite3 data/pt.sqlite3.backup.$(date +%s)
echo "✓ Backup created"
echo ""

# 2. Run migrations
echo "2. Running database migrations..."
npx knex migrate:latest --knexfile knexfile.js
echo "✓ Migrations complete"
echo ""

# 3. Copy updated main.py
echo "3. Updating ML service..."
if [ -f public/main_fixed.py ]; then
    cp public/main.py public/main_backup.py
    cp public/main_fixed.py public/main.py
    echo "✓ ML service updated"
else
    echo "! main_fixed.py not found, skipping"
fi
echo ""

echo "===== UPGRADE COMPLETE ====="
echo "Next steps:"
echo "1. Restart the backend: npm start"
echo "2. (Optional) Start ML service: .venv/Scripts/python public/main.py"
echo ""
