# Apex Database Schema

**Version**: 1.0
**Date**: 2025-11-06
**Database**: PostgreSQL 16 (NOW: Local Docker, NEXT: Supabase)
**ORM**: Prisma

---

## Table of Contents

1. [Entity-Relationship Diagram](#entity-relationship-diagram)
2. [Schema Design Principles](#schema-design-principles)
3. [Table Schemas](#table-schemas)
4. [Indexes and Constraints](#indexes-and-constraints)
5. [Prisma Schema](#prisma-schema)
6. [Sample Data](#sample-data)
7. [Migration Strategy](#migration-strategy)
8. [Data Dictionary](#data-dictionary)

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ reports : "owns"
    users ||--o{ sessions : "has"
    reports ||--o{ documents : "contains"
    reports ||--o{ report_tags : "has"
    documents ||--o{ document_tags : "has"

    users {
        uuid id PK
        text email UK
        text name
        text avatar_url
        text provider
        timestamp created_at
        timestamp updated_at
    }

    sessions {
        uuid id PK
        uuid user_id FK
        text session_token UK
        timestamp expires_at
        timestamp created_at
    }

    reports {
        uuid id PK
        uuid user_id FK
        text title
        text content
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    documents {
        uuid id PK
        uuid report_id FK
        text filename
        text file_hash
        text storage_path
        text parsed_content
        text notes
        bigint file_size
        text mime_type
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    report_tags {
        uuid id PK
        uuid report_id FK
        text tag_name
        text tag_color
        timestamp created_at
    }

    document_tags {
        uuid id PK
        uuid document_id FK
        text tag_name
        text tag_color
        timestamp created_at
    }
```

### Relationship Cardinalities

| Relationship | Cardinality | Cascade Behavior |
|--------------|-------------|------------------|
| User → Report | 1:N | ON DELETE CASCADE |
| User → Session | 1:N | ON DELETE CASCADE |
| Report → Document | 1:N | ON DELETE CASCADE |
| Report → ReportTag | 1:N | ON DELETE CASCADE |
| Document → DocumentTag | 1:N | ON DELETE CASCADE |

**Key Design Decisions**:
- **No folder structure**: Tags only for organization
- **Duplicate detection**: `file_hash` per report (same file can exist in multiple reports)
- **Soft deletes**: `deleted_at` timestamp (data retention for recovery)
- **UUID PKs**: Better for distributed systems, no sequential ID leakage

---

## Schema Design Principles

### 1. Normalization
- **3NF Compliant**: Minimal redundancy, clear entity boundaries
- **Tags as separate tables**: Allows filtering, color consistency, and analytics

### 2. Scalability
- **UUID Primary Keys**: No auto-increment bottlenecks
- **Indexed Foreign Keys**: Fast JOIN operations
- **Text Search Ready**: `tsvector` columns for NEXT phase full-text search

### 3. Data Integrity
- **Foreign Key Constraints**: Referential integrity enforced at database level
- **NOT NULL Constraints**: Explicit nullability
- **Unique Constraints**: Prevent data duplication where required

### 4. Audit Trail
- **created_at**: Immutable timestamp on creation
- **updated_at**: Auto-updated on modification (trigger or ORM)
- **deleted_at**: Soft delete timestamp

### 5. Performance
- **Indexes on FKs**: All foreign keys indexed
- **Composite Indexes**: For common query patterns (user_id + created_at)
- **Partial Indexes**: For filtering non-deleted records

---

## Table Schemas

### PostgreSQL DDL

```sql
-- ============================================
-- ENABLE UUID EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    provider TEXT, -- 'google', 'linkedin', 'email'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User accounts (social login + magic link)';
COMMENT ON COLUMN users.email IS 'User email address (unique identifier)';
COMMENT ON COLUMN users.provider IS 'Authentication provider: google, linkedin, email';

-- ============================================
-- SESSIONS TABLE (NextAuth)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'NextAuth session management';
COMMENT ON COLUMN sessions.session_token IS 'JWT token for session validation';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration (30 days from creation)';

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '', -- Markdown content
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP -- Soft delete
);

COMMENT ON TABLE reports IS 'Research reports (primary deliverable)';
COMMENT ON COLUMN reports.content IS 'Markdown content of the report';
COMMENT ON COLUMN reports.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_hash TEXT NOT NULL, -- SHA-256 hash (64 hex chars)
    storage_path TEXT NOT NULL, -- Local: ./storage/..., NEXT: Supabase URL
    parsed_content TEXT, -- Markdown from LlamaParse
    notes TEXT, -- User notes about this document
    file_size BIGINT NOT NULL, -- Bytes
    mime_type TEXT NOT NULL, -- 'text/plain', 'text/markdown'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP -- Soft delete
);

COMMENT ON TABLE documents IS 'Uploaded reference documents within reports';
COMMENT ON COLUMN documents.file_hash IS 'SHA-256 hash for duplicate detection';
COMMENT ON COLUMN documents.storage_path IS 'NOW: local filesystem path, NEXT: Supabase Storage URL';
COMMENT ON COLUMN documents.parsed_content IS 'LlamaParse extracted markdown (NULL if parsing failed)';
COMMENT ON COLUMN documents.notes IS 'User-added context about document';

-- Add constraint: file_hash unique per report
CREATE UNIQUE INDEX idx_documents_report_file_hash
ON documents(report_id, file_hash)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_documents_report_file_hash IS 'Prevent duplicate files per report (active only)';

-- ============================================
-- REPORT_TAGS TABLE
-- ============================================
CREATE TABLE report_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    tag_color TEXT NOT NULL, -- Hex color: '#3b82f6'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE report_tags IS 'Tags for organizing reports (global namespace)';
COMMENT ON COLUMN report_tags.tag_name IS 'Tag label (e.g., "q4-2024", "tech-sector")';
COMMENT ON COLUMN report_tags.tag_color IS 'Hex color for consistent UI rendering';

-- Prevent duplicate tags on same report
CREATE UNIQUE INDEX idx_report_tags_unique
ON report_tags(report_id, tag_name);

-- ============================================
-- DOCUMENT_TAGS TABLE
-- ============================================
CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    tag_color TEXT NOT NULL, -- Hex color: '#10b981'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE document_tags IS 'Tags for organizing documents within a report (report-scoped)';
COMMENT ON COLUMN document_tags.tag_name IS 'Tag label (e.g., "financial-data", "regulation")';
COMMENT ON COLUMN document_tags.tag_color IS 'Hex color for consistent UI rendering';

-- Prevent duplicate tags on same document
CREATE UNIQUE INDEX idx_document_tags_unique
ON document_tags(document_id, tag_name);

-- ============================================
-- TRIGGER: AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column IS 'Auto-update updated_at timestamp on row modification';
```

---

## Indexes and Constraints

### Primary Keys (UUID)

All tables use UUID primary keys:
```sql
-- Automatically indexed by PostgreSQL
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

### Foreign Key Indexes

```sql
-- Sessions: Fast lookup by user
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Sessions: Fast lookup by token
-- (Already unique indexed via UNIQUE constraint)

-- Reports: Fast lookup by user
CREATE INDEX idx_reports_user_id ON reports(user_id);

-- Documents: Fast lookup by report
CREATE INDEX idx_documents_report_id ON documents(report_id);

-- Report Tags: Fast lookup by report
CREATE INDEX idx_report_tags_report_id ON report_tags(report_id);

-- Document Tags: Fast lookup by document
CREATE INDEX idx_document_tags_document_id ON document_tags(document_id);
```

### Unique Constraints

```sql
-- Users: Email uniqueness
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Sessions: Token uniqueness
CREATE UNIQUE INDEX idx_sessions_token ON sessions(session_token);

-- Documents: File hash unique per report (active only)
CREATE UNIQUE INDEX idx_documents_report_file_hash
ON documents(report_id, file_hash)
WHERE deleted_at IS NULL;

-- Report Tags: No duplicate tags on same report
CREATE UNIQUE INDEX idx_report_tags_unique
ON report_tags(report_id, tag_name);

-- Document Tags: No duplicate tags on same document
CREATE UNIQUE INDEX idx_document_tags_unique
ON document_tags(document_id, tag_name);
```

### Performance Indexes

```sql
-- Reports: Sort by creation date (most common query)
CREATE INDEX idx_reports_user_created
ON reports(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Reports: Filter active reports
CREATE INDEX idx_reports_active
ON reports(user_id)
WHERE deleted_at IS NULL;

-- Documents: Sort by creation date
CREATE INDEX idx_documents_report_created
ON documents(report_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Documents: Filter active documents
CREATE INDEX idx_documents_active
ON documents(report_id)
WHERE deleted_at IS NULL;

-- Sessions: Cleanup expired sessions
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### Full-Text Search Indexes (NEXT Phase)

```sql
-- NEXT PHASE: Add tsvector columns and GIN indexes

-- Reports: Full-text search on title and content
ALTER TABLE reports ADD COLUMN search_vector tsvector;

CREATE INDEX idx_reports_search
ON reports USING GIN(search_vector);

-- Auto-update search vector on content change
CREATE TRIGGER tsvectorupdate_reports BEFORE INSERT OR UPDATE
ON reports FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);

-- Documents: Full-text search on filename and parsed content
ALTER TABLE documents ADD COLUMN search_vector tsvector;

CREATE INDEX idx_documents_search
ON documents USING GIN(search_vector);

CREATE TRIGGER tsvectorupdate_documents BEFORE INSERT OR UPDATE
ON documents FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', filename, parsed_content);

COMMENT ON COLUMN reports.search_vector IS 'Full-text search index (NEXT phase)';
COMMENT ON COLUMN documents.search_vector IS 'Full-text search index (NEXT phase)';
```

---

## Prisma Schema

```prisma
// schema.prisma
// Prisma ORM schema for Apex

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS
// ============================================
model User {
  id         String   @id @default(uuid()) @db.Uuid
  email      String   @unique
  name       String?
  avatarUrl  String?  @map("avatar_url")
  provider   String?  // 'google', 'linkedin', 'email'
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  reports  Report[]
  sessions Session[]

  @@map("users")
}

// ============================================
// SESSIONS (NextAuth)
// ============================================
model Session {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  sessionToken String   @unique @map("session_token")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

// ============================================
// REPORTS
// ============================================
model Report {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  title     String
  content   String    @default("") @db.Text
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Relations
  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  documents  Document[]
  reportTags ReportTag[]

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId], where: deletedAt == null)
  @@map("reports")
}

// ============================================
// DOCUMENTS
// ============================================
model Document {
  id            String    @id @default(uuid()) @db.Uuid
  reportId      String    @map("report_id") @db.Uuid
  filename      String
  fileHash      String    @map("file_hash") // SHA-256 (64 hex chars)
  storagePath   String    @map("storage_path")
  parsedContent String?   @map("parsed_content") @db.Text
  notes         String?   @db.Text
  fileSize      BigInt    @map("file_size")
  mimeType      String    @map("mime_type")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  report       Report        @relation(fields: [reportId], references: [id], onDelete: Cascade)
  documentTags DocumentTag[]

  @@unique([reportId, fileHash], name: "unique_file_per_report", where: deletedAt == null)
  @@index([reportId, createdAt(sort: Desc)])
  @@index([reportId], where: deletedAt == null)
  @@map("documents")
}

// ============================================
// REPORT TAGS
// ============================================
model ReportTag {
  id        String   @id @default(uuid()) @db.Uuid
  reportId  String   @map("report_id") @db.Uuid
  tagName   String   @map("tag_name")
  tagColor  String   @map("tag_color") // Hex color
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@unique([reportId, tagName])
  @@index([reportId])
  @@map("report_tags")
}

// ============================================
// DOCUMENT TAGS
// ============================================
model DocumentTag {
  id         String   @id @default(uuid()) @db.Uuid
  documentId String   @map("document_id") @db.Uuid
  tagName    String   @map("tag_name")
  tagColor   String   @map("tag_color") // Hex color
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, tagName])
  @@index([documentId])
  @@map("document_tags")
}
```

### Prisma Setup Commands

```bash
# Initialize Prisma
npm install prisma --save-dev
npm install @prisma/client
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## Sample Data

### SQL Insert Statements

```sql
-- ============================================
-- SAMPLE DATA
-- ============================================

-- User: Sarah (Financial Analyst)
INSERT INTO users (id, email, name, provider)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'sarah.analyst@example.com',
    'Sarah Chen',
    'google'
);

-- Report 1: Q4 2024 Tech Sector Analysis
INSERT INTO reports (id, user_id, title, content)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Q4 2024 Tech Sector Analysis',
    '# Q4 2024 Tech Sector Analysis

## Executive Summary
Revenue growth accelerated across major tech companies...

## Key Findings
- Meta: Revenue up 23% YoY
- Alphabet: Search revenue strong
- Apple: iPhone sales beat expectations

## Data Sources
See attached documents for detailed financial data.'
);

-- Report 2: Cloud Infrastructure Comparison
INSERT INTO reports (id, user_id, title, content)
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Cloud Infrastructure Comparison 2024',
    '# Cloud Infrastructure Comparison

## Providers Analyzed
- AWS
- Azure
- Google Cloud

## Cost Analysis
Detailed pricing comparison attached.'
);

-- Document 1: Meta Q3 Earnings (Report 1)
INSERT INTO documents (
    id, report_id, filename, file_hash, storage_path,
    parsed_content, notes, file_size, mime_type
)
VALUES (
    'd4e5f6a7-b8c9-0123-def1-234567890123',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'meta-q3-2024-earnings.txt',
    'a3d5c8f9e2b1d7f6c4e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7',
    './storage/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/reports/b2c3d4e5-f6a7-8901-bcde-f12345678901/documents/d4e5f6a7-b8c9-0123-def1-234567890123.txt',
    '# Meta Q3 2024 Earnings Report

**Revenue**: $34.1B (+23% YoY)
**Net Income**: $11.6B
**Key Metrics**:
- Daily Active Users: 2.09B
- Average Revenue per User: $16.29',
    'Focus on revenue guidance - page 3 has detailed breakdown',
    15360,
    'text/plain'
);

-- Document 2: Alphabet Q3 Earnings (Report 1)
INSERT INTO documents (
    id, report_id, filename, file_hash, storage_path,
    parsed_content, notes, file_size, mime_type
)
VALUES (
    'e5f6a7b8-c9d0-1234-ef12-345678901234',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'alphabet-q3-2024-earnings.txt',
    'b4e6d9f1a3c2e8b7d6f5a4c3e2d1b0a9f8e7d6c5b4a3e2f1d0c9b8a7f6e5d4c3',
    './storage/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/reports/b2c3d4e5-f6a7-8901-bcde-f12345678901/documents/e5f6a7b8-c9d0-1234-ef12-345678901234.txt',
    '# Alphabet Q3 2024 Earnings Report

**Revenue**: $76.7B (+11% YoY)
**Operating Income**: $21.3B
**Search Revenue**: $46.2B (+12% YoY)
**YouTube Revenue**: $7.95B (+12% YoY)
**Cloud Revenue**: $8.4B (+35% YoY)',
    'Cloud growth impressive - compare with AWS',
    18720,
    'text/plain'
);

-- Document 3: Apple Q4 Earnings (Report 1)
INSERT INTO documents (
    id, report_id, filename, file_hash, storage_path,
    parsed_content, notes, file_size, mime_type
)
VALUES (
    'f6a7b8c9-d0e1-2345-f123-456789012345',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'apple-q4-2024-earnings.txt',
    'c5f7e0a2b4d3f9e8c7b6a5d4f3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4',
    './storage/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/reports/b2c3d4e5-f6a7-8901-bcde-f12345678901/documents/f6a7b8c9-d0e1-2345-f123-456789012345.txt',
    '# Apple Q4 2024 Earnings Report

**Revenue**: $89.5B (+6% YoY)
**Net Income**: $22.9B
**iPhone Revenue**: $43.8B (+3% YoY)
**Services Revenue**: $22.3B (+16% YoY)
**Mac Revenue**: $7.6B (-34% YoY)',
    'Services growth compensating for hardware slowdown',
    14080,
    'text/plain'
);

-- Document 4: AWS Pricing Guide (Report 2)
INSERT INTO documents (
    id, report_id, filename, file_hash, storage_path,
    parsed_content, file_size, mime_type
)
VALUES (
    'a7b8c9d0-e1f2-3456-1234-567890123456',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'aws-pricing-2024.md',
    'd6f8a1c3e5b7d9f0c8e7b6a5d4f3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5',
    './storage/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/reports/c3d4e5f6-a7b8-9012-cdef-123456789012/documents/a7b8c9d0-e1f2-3456-1234-567890123456.md',
    '# AWS Pricing Guide 2024

## Compute (EC2)
- t3.medium: $0.0416/hour
- m5.large: $0.096/hour

## Storage (S3)
- Standard: $0.023/GB/month
- Glacier: $0.004/GB/month',
    12800,
    'text/markdown'
);

-- Document 5: Azure Pricing Guide (Report 2)
INSERT INTO documents (
    id, report_id, filename, file_hash, storage_path,
    parsed_content, file_size, mime_type
)
VALUES (
    'b8c9d0e1-f2a3-4567-2345-678901234567',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'azure-pricing-2024.md',
    'e7a9b2d4f6c8e0a9b8d7c6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5',
    './storage/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/reports/c3d4e5f6-a7b8-9012-cdef-123456789012/documents/b8c9d0e1-f2a3-4567-2345-678901234567.md',
    '# Azure Pricing Guide 2024

## Compute (VMs)
- B2s: $0.0416/hour
- D2s_v3: $0.096/hour

## Storage (Blob)
- Hot: $0.0184/GB/month
- Cool: $0.01/GB/month',
    11520,
    'text/markdown'
);

-- Report 1 Tags
INSERT INTO report_tags (id, report_id, tag_name, tag_color)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'q4-2024', '#3b82f6'),
    ('22222222-2222-2222-2222-222222222222', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'tech-sector', '#8b5cf6');

-- Report 2 Tags
INSERT INTO report_tags (id, report_id, tag_name, tag_color)
VALUES
    ('33333333-3333-3333-3333-333333333333', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'cloud', '#06b6d4'),
    ('44444444-4444-4444-4444-444444444444', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'cost-analysis', '#f59e0b');

-- Document Tags (Report 1)
INSERT INTO document_tags (id, document_id, tag_name, tag_color)
VALUES
    ('55555555-5555-5555-5555-555555555555', 'd4e5f6a7-b8c9-0123-def1-234567890123', 'financial-data', '#10b981'),
    ('66666666-6666-6666-6666-666666666666', 'e5f6a7b8-c9d0-1234-ef12-345678901234', 'financial-data', '#10b981'),
    ('77777777-7777-7777-7777-777777777777', 'e5f6a7b8-c9d0-1234-ef12-345678901234', 'cloud-revenue', '#06b6d4'),
    ('88888888-8888-8888-8888-888888888888', 'f6a7b8c9-d0e1-2345-f123-456789012345', 'financial-data', '#10b981'),
    ('99999999-9999-9999-9999-999999999999', 'f6a7b8c9-d0e1-2345-f123-456789012345', 'services-growth', '#8b5cf6');

-- Document Tags (Report 2)
INSERT INTO document_tags (id, document_id, tag_name, tag_color)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a7b8c9d0-e1f2-3456-1234-567890123456', 'pricing', '#f59e0b'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b8c9d0e1-f2a3-4567-2345-678901234567', 'pricing', '#f59e0b');

-- Session (active for 30 days)
INSERT INTO sessions (id, user_id, session_token, expires_at)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'session_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    NOW() + INTERVAL '30 days'
);
```

### Prisma Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create user
  const user = await prisma.user.create({
    data: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      email: 'sarah.analyst@example.com',
      name: 'Sarah Chen',
      provider: 'google',
    },
  });

  console.log('Created user:', user.email);

  // Create Report 1
  const report1 = await prisma.report.create({
    data: {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      userId: user.id,
      title: 'Q4 2024 Tech Sector Analysis',
      content: `# Q4 2024 Tech Sector Analysis

## Executive Summary
Revenue growth accelerated across major tech companies...

## Key Findings
- Meta: Revenue up 23% YoY
- Alphabet: Search revenue strong
- Apple: iPhone sales beat expectations

## Data Sources
See attached documents for detailed financial data.`,
      reportTags: {
        create: [
          { tagName: 'q4-2024', tagColor: '#3b82f6' },
          { tagName: 'tech-sector', tagColor: '#8b5cf6' },
        ],
      },
    },
  });

  console.log('Created report:', report1.title);

  // Create Report 2
  const report2 = await prisma.report.create({
    data: {
      id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      userId: user.id,
      title: 'Cloud Infrastructure Comparison 2024',
      content: `# Cloud Infrastructure Comparison

## Providers Analyzed
- AWS
- Azure
- Google Cloud

## Cost Analysis
Detailed pricing comparison attached.`,
      reportTags: {
        create: [
          { tagName: 'cloud', tagColor: '#06b6d4' },
          { tagName: 'cost-analysis', tagColor: '#f59e0b' },
        ],
      },
    },
  });

  console.log('Created report:', report2.title);

  // Create Documents for Report 1
  await prisma.document.create({
    data: {
      reportId: report1.id,
      filename: 'meta-q3-2024-earnings.txt',
      fileHash: 'a3d5c8f9e2b1d7f6c4e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7',
      storagePath: `./storage/users/${user.id}/reports/${report1.id}/documents/meta-q3-2024-earnings.txt`,
      parsedContent: `# Meta Q3 2024 Earnings Report

**Revenue**: $34.1B (+23% YoY)
**Net Income**: $11.6B
**Key Metrics**:
- Daily Active Users: 2.09B
- Average Revenue per User: $16.29`,
      notes: 'Focus on revenue guidance - page 3 has detailed breakdown',
      fileSize: 15360,
      mimeType: 'text/plain',
      documentTags: {
        create: [{ tagName: 'financial-data', tagColor: '#10b981' }],
      },
    },
  });

  await prisma.document.create({
    data: {
      reportId: report1.id,
      filename: 'alphabet-q3-2024-earnings.txt',
      fileHash: 'b4e6d9f1a3c2e8b7d6f5a4c3e2d1b0a9f8e7d6c5b4a3e2f1d0c9b8a7f6e5d4c3',
      storagePath: `./storage/users/${user.id}/reports/${report1.id}/documents/alphabet-q3-2024-earnings.txt`,
      parsedContent: `# Alphabet Q3 2024 Earnings Report

**Revenue**: $76.7B (+11% YoY)
**Operating Income**: $21.3B
**Search Revenue**: $46.2B (+12% YoY)
**YouTube Revenue**: $7.95B (+12% YoY)
**Cloud Revenue**: $8.4B (+35% YoY)`,
      notes: 'Cloud growth impressive - compare with AWS',
      fileSize: 18720,
      mimeType: 'text/plain',
      documentTags: {
        create: [
          { tagName: 'financial-data', tagColor: '#10b981' },
          { tagName: 'cloud-revenue', tagColor: '#06b6d4' },
        ],
      },
    },
  });

  await prisma.document.create({
    data: {
      reportId: report1.id,
      filename: 'apple-q4-2024-earnings.txt',
      fileHash: 'c5f7e0a2b4d3f9e8c7b6a5d4f3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4',
      storagePath: `./storage/users/${user.id}/reports/${report1.id}/documents/apple-q4-2024-earnings.txt`,
      parsedContent: `# Apple Q4 2024 Earnings Report

**Revenue**: $89.5B (+6% YoY)
**Net Income**: $22.9B
**iPhone Revenue**: $43.8B (+3% YoY)
**Services Revenue**: $22.3B (+16% YoY)
**Mac Revenue**: $7.6B (-34% YoY)`,
      notes: 'Services growth compensating for hardware slowdown',
      fileSize: 14080,
      mimeType: 'text/plain',
      documentTags: {
        create: [
          { tagName: 'financial-data', tagColor: '#10b981' },
          { tagName: 'services-growth', tagColor: '#8b5cf6' },
        ],
      },
    },
  });

  console.log('Created 3 documents for Report 1');

  // Create Documents for Report 2
  await prisma.document.create({
    data: {
      reportId: report2.id,
      filename: 'aws-pricing-2024.md',
      fileHash: 'd6f8a1c3e5b7d9f0c8e7b6a5d4f3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5',
      storagePath: `./storage/users/${user.id}/reports/${report2.id}/documents/aws-pricing-2024.md`,
      parsedContent: `# AWS Pricing Guide 2024

## Compute (EC2)
- t3.medium: $0.0416/hour
- m5.large: $0.096/hour

## Storage (S3)
- Standard: $0.023/GB/month
- Glacier: $0.004/GB/month`,
      fileSize: 12800,
      mimeType: 'text/markdown',
      documentTags: {
        create: [{ tagName: 'pricing', tagColor: '#f59e0b' }],
      },
    },
  });

  await prisma.document.create({
    data: {
      reportId: report2.id,
      filename: 'azure-pricing-2024.md',
      fileHash: 'e7a9b2d4f6c8e0a9b8d7c6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5',
      storagePath: `./storage/users/${user.id}/reports/${report2.id}/documents/azure-pricing-2024.md`,
      parsedContent: `# Azure Pricing Guide 2024

## Compute (VMs)
- B2s: $0.0416/hour
- D2s_v3: $0.096/hour

## Storage (Blob)
- Hot: $0.0184/GB/month
- Cool: $0.01/GB/month`,
      fileSize: 11520,
      mimeType: 'text/markdown',
      documentTags: {
        create: [{ tagName: 'pricing', tagColor: '#f59e0b' }],
      },
    },
  });

  console.log('Created 2 documents for Report 2');
  console.log('Seed completed successfully!');
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

**Run seed**:
```bash
npx prisma db seed
```

**package.json**:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Migration Strategy

### NOW Phase: Local PostgreSQL

**Setup**:
```bash
# 1. Start PostgreSQL Docker container
docker run -d \
  --name apex-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=apex_dev \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# 2. Set DATABASE_URL in .env.local
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/apex_dev

# 3. Initialize Prisma
npx prisma init

# 4. Create initial migration
npx prisma migrate dev --name init

# 5. Generate Prisma Client
npx prisma generate

# 6. Seed database with sample data
npx prisma db seed
```

**Development Workflow**:
```bash
# View database in Prisma Studio
npx prisma studio

# Create new migration after schema changes
npx prisma migrate dev --name add_search_vector

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format Prisma schema
npx prisma format

# Validate schema
npx prisma validate
```

### NEXT Phase: Migration to Supabase

**Key Point**: NO schema changes required. Only connection string changes.

**Migration Steps**:

1. **Create Supabase Project**:
   - Go to supabase.com
   - Create new project
   - Copy connection string

2. **Update Environment Variables**:
   ```bash
   # .env.production
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

3. **Run Migrations on Supabase**:
   ```bash
   # Deploy existing migrations to Supabase
   npx prisma migrate deploy
   ```

4. **Enable Row-Level Security (RLS)**:
   ```sql
   -- Supabase: Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
   ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE report_tags ENABLE ROW LEVEL SECURITY;
   ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

   -- Policy: Users can only access their own data
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (auth.uid()::text = id::text);

   CREATE POLICY "Users can view own reports" ON reports
     FOR ALL USING (auth.uid()::text = user_id::text);

   CREATE POLICY "Users can view own documents" ON documents
     FOR ALL USING (
       report_id IN (
         SELECT id FROM reports WHERE user_id::text = auth.uid()::text
       )
     );

   -- Similar policies for report_tags, document_tags, sessions
   ```

5. **File Storage Migration**:
   - **NOW**: Files in `./storage/` directory
   - **NEXT**: Files in Supabase Storage
   - **Migration Script**:
     ```typescript
     // scripts/migrate-to-supabase-storage.ts
     import { createClient } from '@supabase/supabase-js';
     import { PrismaClient } from '@prisma/client';
     import fs from 'fs';

     const prisma = new PrismaClient();
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!
     );

     async function migrateFiles() {
       const documents = await prisma.document.findMany();

       for (const doc of documents) {
         // Read local file
         const fileBuffer = fs.readFileSync(doc.storagePath);

         // Upload to Supabase Storage
         const { data, error } = await supabase.storage
           .from('documents')
           .upload(`${doc.reportId}/${doc.id}`, fileBuffer, {
             contentType: doc.mimeType,
           });

         if (error) throw error;

         // Update database with new storage path
         await prisma.document.update({
           where: { id: doc.id },
           data: {
             storagePath: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${doc.reportId}/${doc.id}`,
           },
         });

         console.log(`Migrated: ${doc.filename}`);
       }
     }

     migrateFiles();
     ```

6. **Verify Migration**:
   ```bash
   # Test connection
   npx prisma db pull

   # Verify data integrity
   npx prisma studio
   ```

**Zero-Downtime Migration**:
- Use Prisma migrate (handles schema changes automatically)
- No manual SQL needed
- Same queries work (Prisma abstracts connection)

**Rollback Plan**:
- Keep local PostgreSQL backup
- Export Supabase data: `pg_dump`
- Restore to local: `psql < backup.sql`

---

## Data Dictionary

### Users Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | User unique identifier |
| email | TEXT | UNIQUE, NOT NULL | User email address |
| name | TEXT | NULL | User display name |
| avatar_url | TEXT | NULL | Profile picture URL |
| provider | TEXT | NULL | Auth provider: 'google', 'linkedin', 'email' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

### Sessions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Session unique identifier |
| user_id | UUID | FK(users.id), NOT NULL | User reference |
| session_token | TEXT | UNIQUE, NOT NULL | JWT session token |
| expires_at | TIMESTAMP | NOT NULL | Session expiration (30 days) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Session creation timestamp |

### Reports Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Report unique identifier |
| user_id | UUID | FK(users.id), NOT NULL | Report owner |
| title | TEXT | NOT NULL | Report title |
| content | TEXT | NOT NULL, DEFAULT '' | Markdown report content |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Report creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

### Documents Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Document unique identifier |
| report_id | UUID | FK(reports.id), NOT NULL | Parent report |
| filename | TEXT | NOT NULL | Original filename |
| file_hash | TEXT | NOT NULL | SHA-256 hash (64 hex chars) |
| storage_path | TEXT | NOT NULL | File location (local or Supabase URL) |
| parsed_content | TEXT | NULL | LlamaParse extracted markdown |
| notes | TEXT | NULL | User notes about document |
| file_size | BIGINT | NOT NULL | File size in bytes |
| mime_type | TEXT | NOT NULL | MIME type (text/plain, text/markdown) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

**Unique Constraint**: `(report_id, file_hash)` WHERE `deleted_at IS NULL`

### ReportTags Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Tag unique identifier |
| report_id | UUID | FK(reports.id), NOT NULL | Tagged report |
| tag_name | TEXT | NOT NULL | Tag label (e.g., 'q4-2024') |
| tag_color | TEXT | NOT NULL | Hex color (e.g., '#3b82f6') |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Tag creation timestamp |

**Unique Constraint**: `(report_id, tag_name)`

### DocumentTags Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Tag unique identifier |
| document_id | UUID | FK(documents.id), NOT NULL | Tagged document |
| tag_name | TEXT | NOT NULL | Tag label (e.g., 'financial-data') |
| tag_color | TEXT | NOT NULL | Hex color (e.g., '#10b981') |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Tag creation timestamp |

**Unique Constraint**: `(document_id, tag_name)`

---

## Database Size Estimates

### Storage Projections

**Assumptions**:
- Average report content: 10KB (markdown)
- Average document: 2MB (text/PDF)
- 50 users, 5 reports each, 20 documents per report

**Calculation**:
```
Users: 50 × 500 bytes = 25KB
Reports: 50 × 5 × 10KB = 2.5MB
Documents (metadata): 50 × 5 × 20 × 1KB = 5MB
Documents (files): 50 × 5 × 20 × 2MB = 10GB
Tags: negligible (~100KB)

Total: ~10GB (mostly file storage)
```

**Database Size** (metadata only): ~10MB
**File Storage Size**: ~10GB

**Supabase Free Tier**: 500MB database, 1GB storage → **Need paid tier**
**Supabase Pro Tier ($25/month)**: 8GB database, 100GB storage → **Sufficient**

---

## Performance Considerations

### Query Optimization

**Slow Query Example** (missing index):
```sql
-- BAD: Full table scan
SELECT * FROM documents
WHERE report_id = 'abc-123'
ORDER BY created_at DESC;
```

**Optimized Query** (uses composite index):
```sql
-- GOOD: Uses idx_documents_report_created
SELECT * FROM documents
WHERE report_id = 'abc-123'
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;
```

### Connection Pooling

**Prisma Configuration**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  pool_size = 10
  connection_timeout = 20
}
```

**Supabase Connection Pooling**:
```bash
# Use pooler URL for serverless (Vercel)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
```

### Caching Strategy (NEXT Phase)

```typescript
// Use Redis for hot data
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Cache user's active reports (5 min TTL)
async function getUserReports(userId: string) {
  const cacheKey = `reports:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) return cached;

  const reports = await prisma.report.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  await redis.setex(cacheKey, 300, reports); // 5 min cache
  return reports;
}
```

---

## Backup and Recovery

### Local Development (NOW)

**Manual Backup**:
```bash
# Backup PostgreSQL database
docker exec apex-db pg_dump -U postgres apex_dev > backup-$(date +%Y%m%d).sql

# Backup files
tar -czf storage-backup-$(date +%Y%m%d).tar.gz ./storage/

# Restore database
docker exec -i apex-db psql -U postgres apex_dev < backup-20251106.sql
```

### Supabase (NEXT)

**Automatic Backups**:
- Supabase Pro: Daily automated backups (7-day retention)
- Manual backups available via dashboard

**Point-in-Time Recovery**:
```bash
# Use Supabase CLI
supabase db dump --db-url $DATABASE_URL > backup.sql
```

---

## Security Considerations

### SQL Injection Prevention

Prisma ORM prevents SQL injection by default (parameterized queries).

**SAFE** (Prisma):
```typescript
const reports = await prisma.report.findMany({
  where: { title: { contains: userInput } }, // Parameterized
});
```

**UNSAFE** (raw SQL):
```typescript
// DON'T DO THIS
const reports = await prisma.$queryRawUnsafe(
  `SELECT * FROM reports WHERE title LIKE '%${userInput}%'`
);
```

### Sensitive Data

**No sensitive data in schema**:
- ✅ User emails (needed for auth)
- ❌ Passwords (magic link only)
- ❌ Payment info (use Stripe, not stored)
- ❌ Social security numbers
- ❌ Financial credentials

**Encryption**:
- Database: Encrypted at rest (Supabase default)
- Files: Encrypted in transit (HTTPS)
- Backups: Encrypted (Supabase default)

---

## Appendix: Common Queries

### Fetch User Reports with Tag Count

```typescript
const reports = await prisma.report.findMany({
  where: {
    userId: currentUserId,
    deletedAt: null,
  },
  include: {
    reportTags: true,
    _count: {
      select: { documents: true },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

### Find Documents by Tag

```typescript
const documents = await prisma.document.findMany({
  where: {
    reportId: currentReportId,
    deletedAt: null,
    documentTags: {
      some: { tagName: 'financial-data' },
    },
  },
  include: {
    documentTags: true,
  },
});
```

### Check for Duplicate File (by hash)

```typescript
const duplicate = await prisma.document.findFirst({
  where: {
    reportId: currentReportId,
    fileHash: calculatedHash,
    deletedAt: null,
  },
});

if (duplicate) {
  // Warn user: file already exists
}
```

### Soft Delete Report (cascade to documents)

```typescript
// Soft delete report
await prisma.report.update({
  where: { id: reportId },
  data: { deletedAt: new Date() },
});

// Soft delete associated documents
await prisma.document.updateMany({
  where: { reportId },
  data: { deletedAt: new Date() },
});
```

### Cleanup Expired Sessions (cron job)

```typescript
// Run daily to clean up expired sessions
await prisma.session.deleteMany({
  where: {
    expiresAt: { lt: new Date() },
  },
});
```

---

**END OF DATABASE SCHEMA**
