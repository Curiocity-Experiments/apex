# Database Quick Start Guide

**For**: ResearchHub NOW Phase (Local Development)
**Database**: PostgreSQL 16 (Docker)
**ORM**: Prisma

---

## 1. Start PostgreSQL Database

```bash
# Start PostgreSQL container
docker run -d \
  --name researchhub-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=researchhub_dev \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# Verify container is running
docker ps | grep researchhub-db

# View logs
docker logs researchhub-db
```

---

## 2. Configure Environment Variables

Create `.env.local` in project root:

```bash
# Database connection
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/researchhub_dev

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth (dev app)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# LinkedIn OAuth (dev app)
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Resend (magic links)
RESEND_API_KEY=re_...

# LlamaParse
LLAMA_CLOUD_API_KEY=llx-...

# Local file storage
STORAGE_PATH=./storage
```

---

## 3. Install Dependencies

```bash
# Install Prisma
npm install prisma --save-dev
npm install @prisma/client

# Initialize Prisma (creates prisma/ directory)
npx prisma init
```

---

## 4. Copy Prisma Schema

Copy the Prisma schema from `/home/user/apex/docs/DATABASE-SCHEMA.md` (section "Prisma Schema") to `prisma/schema.prisma`.

Or create it manually:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... (see DATABASE-SCHEMA.md for full schema)
```

---

## 5. Create Database Schema

```bash
# Create initial migration
npx prisma migrate dev --name init

# This will:
# 1. Create all tables
# 2. Create indexes
# 3. Generate Prisma Client
```

---

## 6. Seed Database with Sample Data

Create `prisma/seed.ts` (see DATABASE-SCHEMA.md for full seed script):

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create user
  const user = await prisma.user.create({
    data: {
      email: 'sarah.analyst@example.com',
      name: 'Sarah Chen',
      provider: 'google',
    },
  });

  console.log('Created user:', user.email);

  // Create reports, documents, tags...
  // (see full seed script in DATABASE-SCHEMA.md)
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "devDependencies": {
    "ts-node": "^10.9.1"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

---

## 7. Explore Database

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio

# Access at: http://localhost:5555
```

---

## 8. Common Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create new migration
npx prisma migrate dev --name add_new_field

# Reset database (deletes all data!)
npx prisma migrate reset

# Format Prisma schema
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from existing database
npx prisma db pull

# Push schema changes (no migration)
npx prisma db push
```

---

## 9. Direct Database Access (psql)

```bash
# Connect to database using psql
docker exec -it researchhub-db psql -U postgres -d researchhub_dev

# Example queries:
# List all tables
\dt

# Describe users table
\d users

# Count users
SELECT COUNT(*) FROM users;

# View all reports
SELECT id, title, created_at FROM reports;

# Exit psql
\q
```

---

## 10. Backup and Restore

```bash
# Backup database
docker exec researchhub-db pg_dump -U postgres researchhub_dev > backup-$(date +%Y%m%d).sql

# Restore database
docker exec -i researchhub-db psql -U postgres researchhub_dev < backup-20251106.sql

# Backup files
tar -czf storage-backup-$(date +%Y%m%d).tar.gz ./storage/
```

---

## 11. Stop/Start/Remove Database

```bash
# Stop container (data preserved)
docker stop researchhub-db

# Start container
docker start researchhub-db

# Remove container (data preserved in volume)
docker rm researchhub-db

# Remove volume (DELETES ALL DATA!)
docker volume rm pgdata
```

---

## 12. Troubleshooting

### Port Already in Use (5432)

```bash
# Check what's using port 5432
lsof -i :5432

# Option 1: Stop existing PostgreSQL
brew services stop postgresql  # macOS
sudo systemctl stop postgresql  # Linux

# Option 2: Use different port
docker run -d \
  --name researchhub-db \
  -p 5433:5432 \  # Use port 5433 instead
  ...

# Update DATABASE_URL:
DATABASE_URL=postgresql://postgres:devpassword@localhost:5433/researchhub_dev
```

### Cannot Connect to Database

```bash
# Check container is running
docker ps | grep researchhub-db

# Check logs
docker logs researchhub-db

# Test connection
docker exec -it researchhub-db psql -U postgres -c "SELECT version();"

# Restart container
docker restart researchhub-db
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma Client
npx prisma generate

# If still issues, clean and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### Migration Failed

```bash
# View migration status
npx prisma migrate status

# Mark migration as applied (if manually fixed)
npx prisma migrate resolve --applied 20251106_init

# Reset and reapply (DELETES DATA!)
npx prisma migrate reset
```

---

## 13. Example Queries (Prisma)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all reports for user
const reports = await prisma.report.findMany({
  where: {
    userId: 'user-uuid',
    deletedAt: null,
  },
  include: {
    reportTags: true,
    _count: { select: { documents: true } },
  },
  orderBy: { createdAt: 'desc' },
});

// Create new report
const newReport = await prisma.report.create({
  data: {
    userId: 'user-uuid',
    title: 'Q4 2024 Analysis',
    content: '# Report content here',
  },
});

// Upload document (with duplicate check)
const existingDoc = await prisma.document.findFirst({
  where: {
    reportId: 'report-uuid',
    fileHash: 'sha256-hash',
    deletedAt: null,
  },
});

if (existingDoc) {
  throw new Error('Duplicate file detected');
}

const document = await prisma.document.create({
  data: {
    reportId: 'report-uuid',
    filename: 'earnings.txt',
    fileHash: 'sha256-hash',
    storagePath: './storage/...',
    fileSize: 15360,
    mimeType: 'text/plain',
  },
});

// Add tags to document
await prisma.documentTag.createMany({
  data: [
    {
      documentId: document.id,
      tagName: 'financial-data',
      tagColor: '#10b981',
    },
    {
      documentId: document.id,
      tagName: 'q3-2024',
      tagColor: '#3b82f6',
    },
  ],
});

// Soft delete report
await prisma.report.update({
  where: { id: 'report-uuid' },
  data: { deletedAt: new Date() },
});
```

---

## 14. Database Performance Tips

```typescript
// Use select to fetch only needed fields
const reports = await prisma.report.findMany({
  select: {
    id: true,
    title: true,
    createdAt: true,
  },
});

// Use pagination for large datasets
const reports = await prisma.report.findMany({
  take: 20,  // Limit
  skip: 0,   // Offset
  orderBy: { createdAt: 'desc' },
});

// Use transactions for atomic operations
await prisma.$transaction([
  prisma.report.create({ data: {...} }),
  prisma.reportTag.create({ data: {...} }),
]);

// Use connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

---

## 15. Next Steps

1. ✅ Start PostgreSQL container
2. ✅ Configure `.env.local`
3. ✅ Run `npx prisma migrate dev`
4. ✅ Seed database with sample data
5. ✅ Open Prisma Studio to explore data
6. 🚀 Start building Next.js app!

**Full Documentation**: See `/home/user/apex/docs/DATABASE-SCHEMA.md`

---

**END OF QUICK START GUIDE**
