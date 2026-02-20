#!/bin/bash
# Setup PostgreSQL 15 on Ubuntu EC2 for Scope Platform
# Run as: sudo bash scripts/setup-postgres.sh
set -e

echo "=== Installing PostgreSQL 15 ==="
apt-get update
apt-get install -y postgresql postgresql-contrib

echo "=== Starting PostgreSQL ==="
systemctl enable postgresql
systemctl start postgresql

# Generate a random password
DB_PASSWORD=$(openssl rand -hex 16)

echo "=== Creating database and user ==="
sudo -u postgres psql <<SQL
CREATE USER scope_user WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE scope_db OWNER scope_user;
GRANT ALL PRIVILEGES ON DATABASE scope_db TO scope_user;
\c scope_db
GRANT ALL ON SCHEMA public TO scope_user;
SQL

echo ""
echo "=== PostgreSQL Setup Complete ==="
echo ""
echo "Add these to your .env file:"
echo ""
echo "DATABASE_MODE=postgres"
echo "DATABASE_URL=postgres://scope_user:${DB_PASSWORD}@localhost:5432/scope_db"
echo ""
echo "Then run the schema:"
echo "  PGPASSWORD='${DB_PASSWORD}' psql -U scope_user -d scope_db -f scripts/postgres-schema.sql"
echo ""
echo "Then migrate data:"
echo "  DATABASE_URL='postgres://scope_user:${DB_PASSWORD}@localhost:5432/scope_db' node scripts/migrate-sqlite-to-postgres.js"
