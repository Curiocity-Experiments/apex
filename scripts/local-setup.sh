#!/bin/bash

# Apex Local Development Setup Script
# This script sets up the local development environment including PostgreSQL, Prisma, and storage

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Check if Docker is running
print_step "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check if .env.local exists
print_step "Checking environment configuration..."
if [ ! -f .env.local ]; then
    print_warning ".env.local not found. Creating from .env.local.example..."
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        print_success "Created .env.local from .env.local.example"
        print_warning "Please update .env.local with your actual values (especially NEXTAUTH_SECRET)"
        echo "  Generate NEXTAUTH_SECRET with: openssl rand -base64 32"
    else
        print_error ".env.local.example not found. Cannot create .env.local"
        exit 1
    fi
else
    print_success ".env.local exists"
fi

# Start PostgreSQL container
print_step "Starting PostgreSQL container..."

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q '^apex-db$'; then
    # Container exists, check if it's running
    if docker ps --format '{{.Names}}' | grep -q '^apex-db$'; then
        print_success "PostgreSQL container already running"
    else
        print_step "Starting existing PostgreSQL container..."
        docker start apex-db
        print_success "PostgreSQL container started"
    fi
else
    # Container doesn't exist, create it
    docker compose up -d postgres
    print_success "PostgreSQL container created and started"
fi

# Wait for PostgreSQL to be ready
print_step "Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U postgres -d apex_dev > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo -n "."
    sleep 1
    RETRIES=$((RETRIES-1))
done
echo ""

if [ $RETRIES -eq 0 ]; then
    print_error "PostgreSQL failed to start within 30 seconds"
    docker compose logs postgres
    exit 1
fi
print_success "PostgreSQL is ready"

# Run Prisma migrations
print_step "Running Prisma migrations..."
if npx prisma migrate deploy; then
    print_success "Prisma migrations completed"
else
    print_warning "Migrations might have already been applied or there was an issue"
    print_step "Trying to generate Prisma client anyway..."
fi

# Generate Prisma Client
print_step "Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated"

# Create storage directory
print_step "Creating storage directory..."
mkdir -p ./storage
print_success "Storage directory created"

# Optional: Run seed script if it exists
if [ -f prisma/seed.ts ]; then
    print_step "Found seed script. Do you want to seed the database? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_step "Seeding database..."
        npm run db:seed
        print_success "Database seeded"
    else
        print_warning "Skipping database seeding"
    fi
else
    print_warning "No seed script found at prisma/seed.ts. Skipping seeding."
fi

# Final success message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Local Development Setup Complete! ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your actual values (if needed)"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Open http://localhost:3100 in your browser"
echo ""
echo "Useful commands:"
echo "  npm run dev              - Start development server"
echo "  npm run local:db:stop    - Stop PostgreSQL container"
echo "  npm run local:db:restart - Restart PostgreSQL container"
echo "  npm run local:db:reset   - Reset database and reseed"
echo "  npx prisma studio        - Open Prisma Studio (database browser)"
echo ""
echo "Troubleshooting:"
echo "  docker ps                     - View running containers"
echo "  docker rm -f apex-db          - Remove existing container (if stuck)"
echo "  docker volume rm apex_apex-pgdata  - Delete all database data"
echo ""
