# Apex Restart Execution Plan

**Version**: 1.0
**Date**: 2025-11-06
**Strategy**: Tag + Clean + Rebuild
**Development Model**: Trunk-Based (Single Developer)

---

## 1. Overview

### Strategy Summary

This plan implements a **simple, clean restart** of Apex development using:

1. **Git Tag Reference** - Tag current state, NO `_legacy/` directory
2. **Clean Workspace** - Remove legacy code, keep documentation
3. **Fresh Build** - Initialize new Apex following Developer Guide
4. **Trunk-Based Development** - All work on `main`, frequent merges

### Why This Approach

**✅ Simple**:
- One git tag preserves all legacy code
- No complex directory structures to maintain
- Clean slate for new architecture

**✅ Trunk-Based Development**:
- Single developer = no feature branch complexity
- Frequent commits keep work safe
- Easy to track progress phase by phase
- Main branch always deployable

**✅ Reversible**:
- Can reference legacy code anytime: `git show legacy-curiocity:<file>`
- Can restore if needed: `git checkout legacy-curiocity`
- Documentation preserved in repo

---

## 2. Pre-Execution Checklist

Before starting, verify these conditions:

### Required Conditions

- [ ] **Git Status Clean**: No uncommitted changes
  ```bash
  git status
  # Should show: "nothing to commit, working tree clean"
  ```

- [ ] **On Correct Branch**: Currently on branch ready to become main
  ```bash
  git branch --show-current
  # Should show: claude/rebuild-vs-refactor-decision-011CUqe8pbbHB8Y4TkPDBStL
  ```

- [ ] **Remote Access**: Can push to remote repository
  ```bash
  git remote -v
  # Verify remote URL is correct
  ```

- [ ] **Documentation Complete**: All planning docs exist
  ```bash
  ls docs/DEVELOPER-GUIDE.md docs/TECHNICAL-SPECIFICATION.md docs/DATABASE-SCHEMA.md
  # All should exist
  ```

### Optional But Recommended

- [ ] **Local Backup**: External backup of entire repository
  ```bash
  # Create backup
  cd /home/user
  tar -czf apex-backup-$(date +%Y%m%d).tar.gz apex/
  ```

- [ ] **Docker Running**: For PostgreSQL later
  ```bash
  docker --version
  # Verify Docker is installed and running
  ```

- [ ] **Node.js 18+**: Correct Node version
  ```bash
  node --version
  # Should be v18.x or higher
  ```

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Lose legacy code | Low | High | Git tag preserves everything |
| Break build midway | Medium | Low | Can restart from any phase |
| Database issues | Low | Medium | Docker container is isolated |
| Dependency conflicts | Low | Low | Fresh npm install |

**Decision Point**: If ANY required condition fails, STOP and resolve before proceeding.

---

## 3. Execution Steps (Detailed)

### Phase A: Tag Current State

**Goal**: Preserve legacy Curiocity code for reference

**Commands**:
```bash
# 1. Ensure clean state
git status
# If dirty, commit or stash changes first

# 2. Create annotated tag with description
git tag -a legacy-curiocity -m "Legacy Curiocity codebase before Apex rebuild

This tag preserves the entire legacy codebase including:
- DynamoDB-based Document/Resource/ResourceMeta architecture
- AWS S3 integration with next-s3-upload
- NextAuth configuration (Google + Credentials)
- React Context-based state management
- All UI components and utilities

Reference this tag to:
- View legacy implementations
- Copy utility functions
- Compare architectures
- Restore if needed

Tagged on: $(date)
Last commit: $(git log -1 --oneline)"

# 3. Verify tag created
git tag -l legacy-curiocity
# Should show: legacy-curiocity

# 4. View tag details
git show legacy-curiocity --stat
# Shows tagged commit and file changes

# 5. Push tag to remote
git push origin legacy-curiocity
```

**Verification**:
```bash
# Check tag exists locally
git tag -l legacy-curiocity

# Check tag exists on remote
git ls-remote --tags origin | grep legacy-curiocity

# View files at this tag
git ls-tree -r legacy-curiocity --name-only | head -20
```

**Checkpoint**: ✅ Tag `legacy-curiocity` created and pushed to remote

---

### Phase B: Switch to Main Branch

**Goal**: Use trunk-based development on `main` branch

**Decision Tree**:

```
Is current branch already called 'main'?
├─ YES → Skip to Phase C
└─ NO  → Does 'main' branch exist?
    ├─ YES → Checkout main and merge current work
    └─ NO  → Rename current branch to main
```

**Option 1: Rename Current Branch to Main** (Recommended for fresh start)

```bash
# 1. Rename current branch to main
git branch -m main

# 2. Set upstream (if remote exists)
git push -u origin main

# 3. Verify
git branch --show-current
# Should show: main
```

**Option 2: Checkout Existing Main**

```bash
# 1. Checkout main
git checkout main

# 2. Merge your planning branch (if needed)
git merge claude/rebuild-vs-refactor-decision-011CUqe8pbbHB8Y4TkPDBStL

# 3. Push
git push origin main
```

**Trunk-Based Development Setup**:

```bash
# Configure main as protected (optional, for team later)
# For now, just ensure main is default branch
git config --local init.defaultBranch main
```

**Checkpoint**: ✅ On `main` branch, all planning docs committed

---

### Phase C: Clean Workspace

**Goal**: Remove all legacy code, keep documentation

**Safety First**:
```bash
# Before deletion, verify tag one more time
git show legacy-curiocity:app/api/auth/\[...nextauth\]/route.ts
# Should display the file content (confirms tag works)
```

**What to Delete**:

```bash
# 1. Legacy application code
rm -rf app/
rm -rf components/
rm -rf context/

# 2. Legacy API routes (already in app/)
# (Already deleted above)

# 3. Legacy utility files
rm -rf lib/
rm -rf types/

# 4. Legacy scripts
rm -rf scripts/

# 5. Legacy configuration (will recreate)
rm -f middleware.ts
rm -f next.config.js
rm -f next.config.mjs

# 6. Legacy test files
rm -rf __mocks__/
rm -f setupTests.ts
rm -f jest.config.js

# 7. Legacy assets
rm -rf assets/

# 8. Unused analysis docs
rm -rf codebase-analysis-docs/

# 9. Package files (will recreate)
rm -f package.json
rm -f package-lock.json

# 10. Node modules
rm -rf node_modules/

# 11. Verify node_modules removed
ls node_modules 2>/dev/null && echo "WARNING: node_modules still exists!" || echo "✓ node_modules removed"
```

**What to Keep**:

```bash
# ✓ Documentation (entire docs/ folder)
# ✓ Git configuration (.git/, .gitignore)
# ✓ Environment example (.env.local.example)
# ✓ Editor configs (components.json for shadcn, .prettierrc, .eslintrc.json)
# ✓ Husky hooks (.husky/)
# ✓ Docker compose (docker-compose.yml - may update later)
# ✓ Tailwind config (tailwind.config.ts - will update)
# ✓ TypeScript config (tsconfig.json - will update)
# ✓ PostCSS config (postcss.config.mjs)
# ✓ README.md and CLAUDE.md
# ✓ Vercel config (.vercel.json)
```

**Verify Deletion**:
```bash
# Check what's left
ls -la

# Should see:
# .git/
# .gitignore
# .husky/
# .prettierrc
# .eslintrc.json
# .env.local.example
# CLAUDE.md
# README.md
# components.json
# docker-compose.yml
# docs/
# postcss.config.mjs
# tailwind.config.ts
# tsconfig.json
# .vercel.json
```

**Stage Deletion**:
```bash
# Stage all deletions
git add -A

# Review changes
git status
# Should show many deletions

# Check diff summary
git diff --cached --stat
# Should show ~200+ files deleted
```

**Checkpoint**: ✅ Legacy code removed, documentation preserved

---

### Phase D: Initialize Fresh Apex Project

**Goal**: Create new Next.js 14 project with minimal dependencies

#### Step D1: Create Package.json

**Create `/home/user/apex/package.json`**:

```json
{
  "name": "apex",
  "version": "0.1.0",
  "private": true,
  "description": "Research document management platform for financial analysts",
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prepare": "husky",
    "test": "jest",
    "format": "prettier --write .",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@prisma/client": "^5.21.1",
    "next-auth": "^4.24.10",
    "bcryptjs": "^2.4.3",
    "resend": "^4.0.1",
    "zod": "^3.23.8",
    "@tanstack/react-query": "^5.59.20",
    "zustand": "^5.0.1",
    "react-simplemde-editor": "^5.2.0",
    "easymde": "^2.18.0",
    "lucide-react": "^0.454.0",
    "posthog-js": "^1.200.1",
    "posthog-node": "^4.2.3",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^20.17.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/bcryptjs": "^5.0.2",
    "prisma": "^5.21.1",
    "ts-node": "^10.9.2",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.13",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.6",
    "husky": "^9.1.6",
    "lint-staged": "^15.2.10",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.2"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": "eslint --fix",
    "*.{js,jsx,ts,tsx,css,md,json}": "prettier --write"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

**Key Differences from Legacy**:
- ✅ Clean dependencies (no AWS SDK, no DynamoDB)
- ✅ Prisma instead of DynamoDB
- ✅ Simplified auth (NextAuth only)
- ✅ React Query for data fetching
- ✅ Zustand for UI state
- ✅ No S3 upload (local filesystem for NOW phase)

#### Step D2: Install Dependencies

```bash
# Install all packages
npm install

# Verify installation
npm list --depth=0
# Should show all packages installed

# Verify critical packages
npm list @prisma/client next next-auth
```

**Expected Output**:
```
apex@0.1.0
├── @prisma/client@5.21.1
├── next@14.2.13
└── next-auth@4.24.10
```

#### Step D3: Initialize Prisma

```bash
# Initialize Prisma (creates prisma/ folder and schema.prisma)
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (we'll use .env.local instead)
```

#### Step D4: Create Prisma Schema

**Create `/home/user/apex/prisma/schema.prisma`** (copy from DATABASE-SCHEMA.md):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Users
model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  provider  String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  reports  Report[]
  sessions Session[]

  @@map("users")
}

// Sessions (NextAuth)
model Session {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  sessionToken String   @unique @map("session_token")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

// Reports
model Report {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  name      String
  content   String    @default("") @db.Text
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  documents  Document[]
  reportTags ReportTag[]

  @@index([userId, createdAt(sort: Desc)])
  @@map("reports")
}

// Documents
model Document {
  id            String    @id @default(uuid()) @db.Uuid
  reportId      String    @map("report_id") @db.Uuid
  filename      String
  fileHash      String    @map("file_hash")
  storagePath   String    @map("storage_path")
  parsedContent String?   @map("parsed_content") @db.Text
  notes         String    @default("")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  report       Report        @relation(fields: [reportId], references: [id], onDelete: Cascade)
  documentTags DocumentTag[]

  @@unique([reportId, fileHash])
  @@index([reportId])
  @@map("documents")
}

// Report Tags
model ReportTag {
  id       String @id @default(uuid()) @db.Uuid
  reportId String @map("report_id") @db.Uuid
  tag      String

  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@unique([reportId, tag])
  @@index([reportId])
  @@map("report_tags")
}

// Document Tags
model DocumentTag {
  id         String @id @default(uuid()) @db.Uuid
  documentId String @map("document_id") @db.Uuid
  tag        String

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, tag])
  @@index([documentId])
  @@map("document_tags")
}
```

#### Step D5: Create Directory Structure

```bash
# Create application directories
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/signup
mkdir -p app/\(app\)/reports
mkdir -p app/api/auth/\[...nextauth\]
mkdir -p app/api/reports
mkdir -p app/api/documents

# Create component directories
mkdir -p components/reports
mkdir -p components/documents
mkdir -p components/shared
mkdir -p components/ui

# Create domain/services/repositories
mkdir -p domain/entities
mkdir -p domain/errors
mkdir -p services
mkdir -p repositories/interfaces
mkdir -p repositories/implementations

# Create utilities
mkdir -p hooks
mkdir -p lib
mkdir -p types
mkdir -p stores

# Create storage directory
mkdir -p storage

# Verify structure
tree -L 2 -d .
```

#### Step D6: Create .env.local

**Create `/home/user/apex/.env.local`** (copy from .env.local.example):

```bash
# Database
DATABASE_URL="postgresql://postgres:devpassword@localhost:5432/apex_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="GENERATE_THIS_WITH_OPENSSL"  # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# Resend (Magic Link)
RESEND_API_KEY="re_your_api_key"

# LlamaParse
LLAMA_CLOUD_API_KEY="llx-your-api-key"

# PostHog
NEXT_PUBLIC_POSTHOG_KEY="phc_your_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# File Storage
STORAGE_PATH="./storage"
```

**Generate NEXTAUTH_SECRET**:
```bash
# Generate secret and add to .env.local
openssl rand -base64 32
# Copy output and replace NEXTAUTH_SECRET value
```

#### Step D7: Start PostgreSQL Database

```bash
# Start PostgreSQL with Docker
docker run -d \
  --name apex-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=apex_dev \
  -v apex-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# Verify running
docker ps | grep apex-db

# Test connection
docker exec apex-db pg_isready -U postgres
# Should output: "accepting connections"
```

#### Step D8: Run Database Migration

```bash
# Generate initial migration
npx prisma migrate dev --name init

# Output should show:
# ✓ Migration created successfully
# ✓ Database schema synced
# ✓ Prisma Client generated

# Generate Prisma Client
npx prisma generate

# Verify client generated
ls node_modules/.prisma/client
# Should show generated files
```

#### Step D9: Create Prisma Client Singleton

**Create `/home/user/apex/lib/db.ts`**:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### Step D10: Create Minimal Next.js Pages

**Create `/home/user/apex/app/layout.tsx`**:

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apex - Research Document Management',
  description: 'Document management platform for financial analysts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Create `/home/user/apex/app/page.tsx`**:

```typescript
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Welcome to Apex</h1>
        <p className="mt-4 text-gray-600">
          Research document management platform
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Phase 0: Project Initialization Complete ✓
        </p>
      </div>
    </div>
  );
}
```

**Create `/home/user/apex/app/globals.css`**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### Step D11: Test Development Server

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3000
# Should see: "Welcome to Apex" page

# Verify:
# ✓ Page loads without errors
# ✓ Tailwind styles applied
# ✓ TypeScript compiles
# ✓ No console errors
```

**Press Ctrl+C to stop server**

**Checkpoint**: ✅ Fresh Apex project initialized, dev server runs successfully

---

### Phase E: First Commit to Main

**Goal**: Commit clean foundation to main branch

#### Step E1: Stage All Changes

```bash
# Stage new files
git add -A

# Review what will be committed
git status
```

**Expected Status**:
```
On branch main
Changes to be committed:
  deleted:    app/ (legacy files)
  deleted:    components/ (legacy files)
  deleted:    context/ (legacy files)
  # ... many deletions ...

  new file:   package.json
  new file:   prisma/schema.prisma
  new file:   app/layout.tsx
  new file:   app/page.tsx
  new file:   app/globals.css
  new file:   lib/db.ts
  new file:   .env.local
  # ... new files ...
```

#### Step E2: Create Commit

```bash
git commit -m "$(cat <<'EOF'
Initialize Apex rebuild: Clean foundation with Next.js 14 + Prisma

BREAKING CHANGE: Complete rebuild from scratch

This commit removes all legacy Curiocity code and initializes a clean
Apex project following the new architecture documented in:
- docs/DEVELOPER-GUIDE.md
- docs/TECHNICAL-SPECIFICATION.md
- docs/DATABASE-SCHEMA.md

## Changes

### Deleted (Preserved in tag: legacy-curiocity)
- Legacy app/ with DynamoDB integration
- Legacy components/ with AWS dependencies
- Legacy context/ state management
- Legacy scripts/ and utilities
- ~150+ legacy files

### Added
- Next.js 14 with App Router
- Prisma ORM with PostgreSQL schema
- Clean project structure (Phase 0 complete)
- Minimal package.json with essential dependencies
- Development environment configuration

### Technical Stack
- Frontend: Next.js 14, React 18, TypeScript
- Database: PostgreSQL 16 (Docker) with Prisma ORM
- Auth: NextAuth (setup pending)
- Styling: Tailwind CSS
- State: React Query + Zustand (setup pending)

### Project Status
✓ Phase 0: Project Initialization (COMPLETE)
- [x] Next.js project created
- [x] Dependencies installed
- [x] Prisma configured
- [x] Database running
- [x] Dev server working

⏳ Phase 1: Core Infrastructure (NEXT)
- [ ] Domain entities
- [ ] Repository interfaces
- [ ] Service layer
- [ ] NextAuth setup

## Verification
```bash
npm run dev  # Should start server on http://localhost:3000
npx prisma studio  # Should open database GUI
docker ps | grep apex-db  # Should show running container
```

## Reference
Legacy code: git show legacy-curiocity:<file>
Documentation: docs/RESTART-PLAN.md
Developer Guide: docs/DEVELOPER-GUIDE.md

Co-authored-by: Claude Code <code@anthropic.com>
EOF
)"
```

#### Step E3: Push to Remote

```bash
# Push to remote main branch
git push origin main

# If main doesn't exist on remote yet:
git push -u origin main
```

#### Step E4: Verify Commit

```bash
# View commit
git log --oneline -1

# View files in commit
git show --stat

# Verify remote has commit
git log origin/main --oneline -1
```

**Checkpoint**: ✅ Phase 0 complete, committed and pushed to main

---

### Phase F: Begin Phase 1 Development

**Goal**: Start implementing core infrastructure following Developer Guide

#### Reference Documentation

At this point, switch to following the Developer Guide step-by-step:

**Primary Reference**: `/home/user/apex/docs/DEVELOPER-GUIDE.md`

**Current Location**: Phase 1 (starting at Step 6)

#### Phase 1 Overview (from Developer Guide)

**Steps to implement** (6-10):
1. ✓ Create project structure (already done in Phase D5)
2. Create Prisma client singleton (already done in Phase D9)
3. Create domain entities (Report, Document)
4. Create repository interfaces
5. Implement repositories (PrismaReportRepository, PrismaDocumentRepository)

#### Quick Start Phase 1

```bash
# Step 1: Create domain entities
# Follow: docs/DEVELOPER-GUIDE.md - Step 8

mkdir -p domain/entities

# Create domain/entities/Report.ts
# Create domain/entities/Document.ts
# (See Developer Guide for full code)

# Step 2: Create repository interfaces
# Follow: docs/DEVELOPER-GUIDE.md - Step 9

mkdir -p repositories/interfaces

# Create repositories/interfaces/IReportRepository.ts
# Create repositories/interfaces/IDocumentRepository.ts
# (See Developer Guide for full code)

# Step 3: Implement repositories
# Follow: docs/DEVELOPER-GUIDE.md - Step 10

mkdir -p repositories/implementations

# Create repositories/implementations/PrismaReportRepository.ts
# Create repositories/implementations/PrismaDocumentRepository.ts
# (See Developer Guide for full code)

# Step 4: Commit after each major component
git add domain/entities/Report.ts
git commit -m "Add Report domain entity with validation"

git add domain/entities/Document.ts
git commit -m "Add Document domain entity with validation"

# Continue following Developer Guide...
```

#### Development Workflow

For each step in Developer Guide:

1. **Read the step** in docs/DEVELOPER-GUIDE.md
2. **Implement the code** exactly as specified
3. **Test locally** (npm run dev, type checking)
4. **Commit** with descriptive message
5. **Push frequently** (at least once per day)

**Checkpoint**: ✅ Phase 1 started, following Developer Guide

---

## 4. Trunk-Based Development Strategy

### Core Principles

**1. All Work on Main**
- No long-lived feature branches
- Small, atomic commits directly to main
- Main is always in working state

**2. Commit Frequency**
- Commit after completing each component
- Minimum: Daily commits
- Ideal: Multiple commits per day

**3. Commit Size**
- Small, focused changes
- Each commit should:
  - Add one feature/component
  - Be deployable (or clearly marked WIP)
  - Have descriptive message

**4. Integration Points**
- After each Phase (0, 1, 2, etc.) → Merge to main (already on main!)
- After each major feature → Commit to main
- No "merge hell" because there are no branches

### Commit Message Conventions

**Format**:
```
<type>: <short description>

<detailed description>

<breaking changes>
<references>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Add/update tests
- `chore`: Maintenance

**Examples**:

```bash
# Feature commit
git commit -m "feat: Add Report domain entity with validation

Implements Report entity from DEVELOPER-GUIDE.md Step 8
- Zod schema for validation
- Create/update methods
- Immutable timestamps

Reference: docs/DEVELOPER-GUIDE.md#step-8"

# Service commit
git commit -m "feat: Add ReportService with CRUD operations

Implements business logic layer for reports:
- createReport(userId, name)
- getReport(id, userId)
- updateReport(id, updates)
- deleteReport(id, userId)

All methods enforce user authorization.

Reference: docs/DEVELOPER-GUIDE.md#step-11"

# Checkpoint commit (end of phase)
git commit -m "feat: Complete Phase 1 - Core Infrastructure

All Phase 1 components implemented:
✓ Domain entities (Report, Document)
✓ Repository interfaces
✓ Repository implementations
✓ Prisma integration tested

Next: Phase 2 - Business Logic

Reference: docs/DEVELOPER-GUIDE.md#phase-2"
```

### When to Create Feature Branches (Rare)

Only create branches for:

1. **Experimental work** - Testing a risky approach
   ```bash
   git checkout -b experiment/new-parser-library
   # Try implementation
   # If works: merge to main
   # If doesn't: delete branch
   ```

2. **Parallel exploration** - Comparing two solutions
   ```bash
   git checkout -b explore/zustand-vs-context
   # Test approach
   # Keep one, delete other
   ```

**Rules for Feature Branches**:
- Must live < 1 day
- Merge or delete immediately
- Never accumulate branches
- Main is still the source of truth

### Merge Frequency

**After Each Phase** (from Developer Guide):

| Phase | Estimated Time | Merge Point |
|-------|---------------|-------------|
| Phase 0 | 2 hours | ✓ Already merged |
| Phase 1 | 6 hours | After core infrastructure complete |
| Phase 2 | 8 hours | After business logic complete |
| Phase 3 | 8 hours | After API routes complete |
| Phase 4 | 12 hours | After frontend components complete |
| Phase 5 | 6 hours | After pages complete |
| Phase 6 | 8 hours | After testing complete |
| Phase 7 | 4 hours | After polish complete |

**Merge = Commit to Main** (since already on main)

### Handling Work In Progress

**Option 1: WIP Commits** (Recommended)
```bash
git commit -m "WIP: Partially implement DocumentService

- uploadDocument() complete
- getDocument() complete
- TODO: deleteDocument()
- TODO: Add tests

Will complete in next commit."

git push origin main
```

**Option 2: Git Stash**
```bash
# Save work temporarily
git stash save "DocumentService partial implementation"

# Work on something else
git commit -m "Fix urgent bug in ReportService"

# Resume work
git stash pop
```

**Option 3: Draft PR** (For Later Team Context)
```bash
# Create branch only for PR context
git checkout -b feature/document-upload
git push origin feature/document-upload

# Create draft PR for discussion
# Once approved, merge immediately and delete branch
```

---

## 5. Git Tag Reference Guide

### Viewing Legacy Code

**View entire file**:
```bash
git show legacy-curiocity:path/to/file.ts
```

**Examples**:
```bash
# View NextAuth configuration
git show legacy-curiocity:app/api/auth/\[...nextauth\]/route.ts

# View Context provider
git show legacy-curiocity:context/AppContext.tsx

# View utility function
git show legacy-curiocity:lib/utils.ts

# View component
git show legacy-curiocity:components/ui/button.tsx
```

**Copy file from tag**:
```bash
git show legacy-curiocity:lib/utils.ts > lib/utils.ts
```

**List all files at tag**:
```bash
git ls-tree -r legacy-curiocity --name-only
```

**Search for file by name**:
```bash
git ls-tree -r legacy-curiocity --name-only | grep "ReportCard"
```

**View specific directory**:
```bash
git ls-tree -r legacy-curiocity --name-only | grep "^components/ui/"
```

### Comparing Changes

**Compare file between tag and current**:
```bash
git diff legacy-curiocity:app/layout.tsx app/layout.tsx
```

**See what changed in a directory**:
```bash
git diff legacy-curiocity main -- app/
```

**Statistics of changes**:
```bash
git diff --stat legacy-curiocity main
```

### Checking Out Legacy Files Temporarily

**Checkout single file to view (doesn't modify working tree)**:
```bash
# View in temporary location
git show legacy-curiocity:app/api/db/route.ts > /tmp/legacy-db-route.ts
cat /tmp/legacy-db-route.ts
```

**Create temporary branch of legacy code**:
```bash
# Create branch at tag (for exploration only)
git checkout -b temp-legacy-view legacy-curiocity

# Explore code
ls app/
cat app/api/auth/\[...nextauth\]/route.ts

# Return to main, delete branch
git checkout main
git branch -D temp-legacy-view
```

### Advanced Tag Operations

**View tag metadata**:
```bash
git show legacy-curiocity
```

**List all tags**:
```bash
git tag -l
```

**View commits since tag**:
```bash
git log legacy-curiocity..HEAD --oneline
```

**Create additional tags for milestones**:
```bash
# Tag Phase 1 completion
git tag -a phase-1-complete -m "Phase 1: Core Infrastructure Complete"
git push origin phase-1-complete

# Tag Phase 2 completion
git tag -a phase-2-complete -m "Phase 2: Business Logic Complete"
git push origin phase-2-complete
```

---

## 6. Rollback Plan

### Scenario 1: Need to Restore Legacy Code

**Full restore**:
```bash
# 1. Create backup of current work
git checkout -b backup-apex-attempt-1

# 2. Reset main to legacy tag
git checkout main
git reset --hard legacy-curiocity

# 3. Push (WARNING: Destructive, use --force-with-lease)
git push --force-with-lease origin main

# 4. Verify
git log -1
# Should show legacy commit
```

**Partial restore (specific file)**:
```bash
# Restore single file from legacy
git checkout legacy-curiocity -- app/api/auth/\[...nextauth\]/route.ts

# Commit
git add app/api/auth/\[...nextauth\]/route.ts
git commit -m "Restore legacy NextAuth config from tag"
```

### Scenario 2: Restart Phase

**If Phase 1 went wrong**:
```bash
# 1. Find commit before Phase 1
git log --oneline | grep "Phase 0"
# Note commit hash, e.g., abc1234

# 2. Reset to that commit
git reset --hard abc1234

# 3. Restart Phase 1
# Follow Developer Guide from Step 6
```

### Scenario 3: Database Corruption

**Reset database**:
```bash
# 1. Stop server
# Ctrl+C in terminal running npm run dev

# 2. Reset database
npx prisma migrate reset

# 3. Re-run migrations
npx prisma migrate dev

# 4. Seed database (if seed script exists)
npx prisma db seed

# 5. Restart server
npm run dev
```

### Scenario 4: Dependency Issues

**Clean reinstall**:
```bash
# 1. Remove node_modules and lock file
rm -rf node_modules package-lock.json

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall
npm install

# 4. Verify
npm list --depth=0
```

### Safety Measures

**Before risky operations**:

1. **Create safety branch**:
   ```bash
   git checkout -b safety-checkpoint
   git checkout main
   ```

2. **Create local backup**:
   ```bash
   cd /home/user
   cp -r apex apex-backup-$(date +%Y%m%d-%H%M%S)
   ```

3. **Push to remote**:
   ```bash
   git push origin main
   # Remote acts as backup
   ```

**Recovery from backups**:
```bash
# If all else fails
cd /home/user
rm -rf apex
tar -xzf apex-backup-20251106.tar.gz
cd apex
```

---

## 7. Next Steps After Restart

### Immediate Tasks (Phase 1)

Follow Developer Guide sequentially:

1. **Step 8: Create Domain Entities**
   - `domain/entities/Report.ts`
   - `domain/entities/Document.ts`
   - Estimated: 1 hour

2. **Step 9: Create Repository Interfaces**
   - `repositories/interfaces/IReportRepository.ts`
   - `repositories/interfaces/IDocumentRepository.ts`
   - Estimated: 30 minutes

3. **Step 10: Implement Repositories**
   - `repositories/implementations/PrismaReportRepository.ts`
   - `repositories/implementations/PrismaDocumentRepository.ts`
   - Estimated: 2 hours

**Phase 1 Checkpoint**: Core infrastructure complete (6 hours total)

### Phase 2: Business Logic (8 hours)

**Steps 11-13** from Developer Guide:
- Service layer (ReportService, DocumentService)
- File storage service
- Parser service (LlamaParse integration)

### Reference Documents

As you build, refer to:

1. **Primary Guide**: `docs/DEVELOPER-GUIDE.md`
   - Step-by-step implementation
   - Code examples for each component
   - Checkpoints and verification

2. **Architecture**: `docs/TECHNICAL-SPECIFICATION.md`
   - System design decisions
   - Layer responsibilities
   - Migration strategy

3. **Database**: `docs/DATABASE-SCHEMA.md`
   - Schema details
   - Query examples
   - Performance considerations

4. **Legacy Reference**: `docs/REFERENCE-FROM-LEGACY.md`
   - Reusable patterns
   - Configuration files
   - Utility functions

5. **This Document**: `docs/RESTART-PLAN.md`
   - Git tag reference
   - Trunk-based workflow
   - Rollback procedures

### Development Rhythm

**Daily Routine**:

```bash
# Morning: Review plan
cat docs/DEVELOPER-GUIDE.md | grep "Phase [12]" -A 20

# Work: Implement 2-3 steps
# (Code, test, commit)

# Afternoon: Verify and push
npm run build  # Verify TypeScript compiles
npm run lint   # Verify ESLint passes
git status     # Check for uncommitted work
git push origin main  # Push daily

# Evening: Update plan
# Mark completed steps in Developer Guide
# Plan next day's work
```

**Weekly Milestones**:

| Day | Goal | Checkpoint |
|-----|------|-----------|
| Day 1 | Phase 0 + Phase 1 | ✓ Core infrastructure |
| Day 2 | Phase 2 | ✓ Business logic |
| Day 3 | Phase 3 | ✓ API routes |
| Day 4 | Phase 4 (Part 1) | ✓ React hooks + Report components |
| Day 5 | Phase 4 (Part 2) | ✓ Document components |
| Day 6 | Phase 5 | ✓ Pages and routing |
| Day 7 | Phase 6 + Phase 7 | ✓ Testing + Polish |

**Total**: 7 days to complete NOW phase MVP

---

## Summary Checklist

Before executing this plan, verify:

### Pre-Execution
- [ ] Git status clean
- [ ] On correct branch
- [ ] Remote access working
- [ ] Documentation complete
- [ ] Local backup created

### Phase A: Tag
- [ ] Tag `legacy-curiocity` created
- [ ] Tag pushed to remote
- [ ] Tag verified with `git show`

### Phase B: Main Branch
- [ ] On `main` branch
- [ ] All work committed

### Phase C: Clean
- [ ] Legacy code deleted
- [ ] Documentation preserved
- [ ] Deletions staged

### Phase D: Initialize
- [ ] `package.json` created
- [ ] Dependencies installed
- [ ] Prisma configured
- [ ] Database running
- [ ] Directory structure created
- [ ] `.env.local` configured
- [ ] Dev server runs

### Phase E: Commit
- [ ] Changes committed to main
- [ ] Pushed to remote
- [ ] Commit verified

### Phase F: Phase 1
- [ ] Following Developer Guide
- [ ] Step 8 started (Domain entities)

---

## Quick Reference Commands

```bash
# View legacy code
git show legacy-curiocity:path/to/file

# List legacy files
git ls-tree -r legacy-curiocity --name-only

# Current status
git status
git log --oneline -5

# Database
docker ps | grep apex-db
npx prisma studio

# Development
npm run dev
npm run build
npm run lint

# Git workflow
git add -A
git commit -m "feat: description"
git push origin main

# Rollback
git reset --hard <commit-hash>
git checkout legacy-curiocity
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Maintained By**: Development Team
**Related Docs**:
- `docs/DEVELOPER-GUIDE.md` - Step-by-step implementation
- `docs/TECHNICAL-SPECIFICATION.md` - Architecture details
- `docs/DATABASE-SCHEMA.md` - Database design
- `docs/REFERENCE-FROM-LEGACY.md` - Legacy code reference

**Status**: ✅ Ready for Execution

---

*Execute this plan sequentially. Do not skip phases. Commit frequently. Reference documentation continuously.*
