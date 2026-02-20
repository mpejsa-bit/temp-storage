#!/bin/bash
set -e

echo "=== Scope Platform Deployment ==="

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose-v2
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
    echo "Docker installed. Please log out and back in, then re-run this script."
    exit 0
fi

# Check .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found in current directory."
    echo "Create a .env file with the required variables:"
    echo "  AUTH_SECRET=<openssl rand -hex 32>"
    echo "  ENCRYPTION_KEY=<openssl rand -hex 32>"
    echo "  AUTH_TRUST_HOST=true"
    echo "  NEXTAUTH_URL=http://<EC2_PUBLIC_IP>:3000"
    echo "  SF_LOGIN_URL=https://login.salesforce.com"
    echo "  SF_CLIENT_ID=<your salesforce client id>"
    echo "  SF_CLIENT_SECRET=<your salesforce client secret>"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data

# Build and start
echo "Building and starting containers..."
docker compose up -d --build

echo ""
echo "=== Deployment complete ==="
echo "View logs: docker compose logs -f"
echo "App URL:   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<EC2_PUBLIC_IP>'):3000"
