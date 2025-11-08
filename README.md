# Apex

A Next.js application for research document management with intelligent file parsing capabilities. Built for financial analysts to organize research reports, upload documents, and leverage AI-powered parsing.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Quick Start - Local Development](#quick-start---local-development)
- [Manual Setup (Alternative)](#manual-setup-alternative)
- [Development Commands](#development-commands)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Documentation](#documentation)
- [Known Issues](#known-issues)
- [Contributing](#contributing)

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **PostgreSQL 16** - Relational database
- **Prisma** - Modern ORM for database access
- **NextAuth** - Authentication (Google OAuth + Email/Magic Link)
- **LlamaCloud** - AI-powered document parsing (optional)
- **Tailwind CSS** - Utility-first styling
- **PostHog** - Analytics (optional)
- **Resend** - Email delivery for magic links

## Key Features

- **Report Management** - Create and organize research reports with rich markdown content
- **Document Upload** - Upload files with automatic AI parsing to markdown
- **Content Deduplication** - Intelligent file storage using hash-based deduplication
- **Rich Metadata** - Add notes and tags to both reports and documents
- **Search & Filtering** - Filter by tags, date range, and search by name
- **Authentication** - Sign in with Google OAuth or magic link email
- **Analytics** - Track usage with PostHog (optional)

---

## Quick Start - Local Development

**No cloud services needed!** Everything runs locally with Docker.

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** (comes with Node.js)
- **Docker** - [Download here](https://www.docker.com/products/docker-desktop/)

### One-Command Setup

```bash
# 1. Clone the repository
git clone https://github.com/Curiocity-Experiments/apex.git
cd apex

# 2. Install dependencies
npm install

# 3. Run the setup script (starts PostgreSQL, runs migrations, creates storage)
npm run local:setup

# 4. Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

**That's it!** The `local:setup` script will:
- ✅ Create `.env.local` from the example file
- ✅ Start PostgreSQL in Docker
- ✅ Run database migrations
- ✅ Generate Prisma Client
- ✅ Create storage directory
- ✅ Optionally seed the database with sample data

---

## Manual Setup (Alternative)

If you prefer to set up step-by-step:

### Step 1: Clone and Install

```bash
git clone https://github.com/Curiocity-Experiments/apex.git
cd apex
npm install
```

### Step 2: Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set `NEXTAUTH_SECRET`:

```bash
# Generate a secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET=your-generated-secret-here
```

### Step 3: Start PostgreSQL

```bash
npm run local:db:start
```

This starts PostgreSQL in Docker on port 5432.

### Step 4: Run Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 5: Create Storage Directory

```bash
mkdir -p storage
```

### Step 6: (Optional) Seed Database

```bash
npm run db:seed
```

### Step 7: Start Development Server

```bash
npm run dev
```

---

## Development Commands

### Running the Application

```bash
npm run dev          # Start development server with Turbo
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Database Management

```bash
npm run local:setup         # Complete local setup (one command)
npm run local:db:start      # Start PostgreSQL container
npm run local:db:stop       # Stop PostgreSQL container
npm run local:db:restart    # Restart PostgreSQL container
npm run local:db:reset      # Reset database and reseed
npm run local:db:logs       # View PostgreSQL logs

npx prisma studio           # Open Prisma Studio (database GUI)
npx prisma migrate dev      # Create new migration
npx prisma generate         # Generate Prisma Client
npm run db:seed             # Seed database with sample data
```

### Testing

```bash
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests only
```

---

## Project Structure

```
apex/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # NextAuth configuration
│   │   ├── reports/           # Report endpoints
│   │   └── documents/         # Document endpoints
│   ├── (auth)/                # Auth pages (login)
│   └── (dashboard)/           # Protected dashboard pages
├── components/
│   ├── reports/               # Report components
│   ├── documents/             # Document components
│   └── ui/                    # Reusable UI components
├── lib/
│   ├── db.ts                  # Prisma client singleton
│   └── auth.ts                # NextAuth configuration
├── domain/                     # Business logic (clean architecture)
│   ├── entities/              # Domain entities
│   ├── repositories/          # Repository interfaces
│   └── use-cases/             # Application use cases
├── infrastructure/             # Infrastructure layer
│   └── repositories/          # Prisma repository implementations
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed script
├── scripts/
│   └── local-setup.sh         # Local development setup
├── __tests__/                  # Test files
├── docker-compose.yml          # PostgreSQL container config
├── .env.local.example          # Environment template
└── README.md
```

---

## Environment Variables

### Required for Local Development

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:devpassword@localhost:5432/apex_dev` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Generate with `openssl rand -base64 32` |

### Optional Services

| Variable | Description | Required For |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Google sign-in |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth Client ID | LinkedIn sign-in |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth Secret | LinkedIn sign-in |
| `RESEND_API_KEY` | Resend API key | Magic link emails |
| `RESEND_FROM_EMAIL` | Email sender address | Magic link emails |
| `LLAMA_CLOUD_API_KEY` | LlamaCloud API key | Document parsing |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL | Analytics |
| `STORAGE_PATH` | Local file storage path | File uploads (default: `./storage`) |

**Note:** The `.env.local.example` file has sensible defaults for local development. You can start developing with just `NEXTAUTH_SECRET` configured.

---

## Testing

Apex follows Test-Driven Development (TDD) principles.

**Guides:**
- [TDD Guide](./docs/TDD-GUIDE.md) - Comprehensive testing guide
- [Behavior vs Implementation](./docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md) - Testing philosophy

**Test Configuration:**
- **Framework:** Jest with TypeScript support
- **Environment:** jsdom for React components
- **Coverage:** Run with `npm run test:coverage`

**Writing Tests:**

```typescript
// Example: Testing a use case
import { CreateReportUseCase } from '@/domain/use-cases/CreateReportUseCase';

describe('CreateReportUseCase', () => {
  it('creates a new report with valid data', async () => {
    const useCase = new CreateReportUseCase(mockRepository);
    const result = await useCase.execute({
      userId: 'user-123',
      name: 'Q4 Analysis',
      content: '# Report content',
    });

    expect(result.name).toBe('Q4 Analysis');
  });
});
```

---

## Documentation

### Core Documentation

- **[Developer Guide](./docs/DEVELOPER-GUIDE.md)** - Complete implementation guide
- **[Database Schema](./docs/DATABASE-SCHEMA.md)** - Database design and models
- **[Database Quick Start](./docs/DATABASE-QUICKSTART.md)** - Database setup guide
- **[Component Structure](./docs/technical-spec/component-structure.md)** - UI component architecture

### Architecture & Audits

- **[docs/audits/](./docs/audits/)** - Architecture and security audit reports
- **[CLAUDE.md](./CLAUDE.md)** - Guidance for AI code assistance

---

## Data Model

The application uses **content deduplication** for efficient storage:

### Core Models

- **User** - User account (email, name, provider)
- **Report** - Research report container (markdown content, tags)
- **Document** - Uploaded file (filename, content hash, storage path, parsed content)
- **Tags** - Tags for both reports and documents

### Deduplication Strategy

- Documents are identified by SHA-256 hash of file content
- Same file uploaded multiple times = stored once
- Each upload creates a new document record with the same hash
- Unique constraint on `(reportId, fileHash)` prevents duplicates within a report

**Example:**
```
User uploads "earnings.pdf" to Report A → Document 1 created
User uploads same file to Report B  → Document 2 created (references same content)
Storage: Only 1 copy of file saved
```

---

## Architecture

Apex follows **Clean Architecture** principles:

```
Presentation Layer (React Components)
         ↓
   Use Cases (Business Logic)
         ↓
 Repository Interfaces (Contracts)
         ↓
Prisma Repositories (Implementation)
         ↓
      Database
```

**Benefits:**
- Business logic independent of frameworks
- Testable in isolation
- Easy to swap infrastructure (e.g., change database)
- Clear separation of concerns

---

## Known Issues

### 1. TypeScript and ESLint in Production

**Note:** TypeScript errors and ESLint warnings do not block builds (see `next.config.js`). This is intentional for rapid iteration but should be fixed before production deployment.

### 2. Mobile Responsiveness

**Not implemented** for devices smaller than laptop screens. Desktop/laptop only for now.

### 3. File Parsing

LlamaCloud parsing is optional. Set `LLAMA_CLOUD_API_KEY` to enable, or skip parsing and use manual notes.

---

## Contributing

### Code Style

- **Prettier:** 80 char line width, single quotes, trailing commas
- **ESLint:** Next.js config with TypeScript
- **Imports:** Use `@/*` path alias for project root

### Pre-commit Hooks

Husky + lint-staged automatically run ESLint and Prettier on staged files.

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and write tests
3. Run tests: `npm test`
4. Commit with descriptive message
5. Push and create PR

---

## Troubleshooting

### Port 5432 Already in Use

If you have PostgreSQL installed locally:

```bash
# macOS
brew services stop postgresql

# Linux
sudo systemctl stop postgresql

# Or use a different port in docker-compose.yml
ports:
  - "5433:5432"  # Use port 5433

# Then update .env.local
DATABASE_URL="postgresql://postgres:devpassword@localhost:5433/apex_dev"
```

### Cannot Connect to Database

```bash
# Check container is running
docker ps | grep apex-db

# View logs
npm run local:db:logs

# Restart container
npm run local:db:restart
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma Client
npx prisma generate

# If still issues
rm -rf node_modules/.prisma
npx prisma generate
```

---

## Production Deployment

For production deployment to Vercel:

1. **Set environment variables** in Vercel dashboard
2. **Configure PostgreSQL** (use managed service like Neon, Supabase, or Railway)
3. **Update `DATABASE_URL`** to production connection string
4. **Deploy:** `vercel --prod`

**Note:** See [Developer Guide](./docs/DEVELOPER-GUIDE.md) for detailed production deployment instructions.

---

## Contact Information

**Project:** Apex Research Platform

**Issues:** [GitHub Issues](https://github.com/Curiocity-Experiments/apex/issues)

---

## License

This project is private and not licensed for public use.
