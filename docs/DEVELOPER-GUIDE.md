# ResearchHub Developer Implementation Guide

**Version**: 1.0
**Date**: 2025-11-06
**Phase**: NOW (Core MVP)
**Estimated Time**: 40-60 hours for complete implementation

---

## Overview

This guide provides step-by-step instructions to build **ResearchHub** from scratch following clean architecture principles. By the end, you'll have a working MVP running locally.

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **npm 9+** installed (`npm --version`)
- [ ] **Docker** installed and running (`docker --version`)
- [ ] **Git** installed (`git --version`)
- [ ] **Code editor** (VS Code recommended)
- [ ] **PostgreSQL client** (optional, for manual queries)

---

## Phase 0: Project Initialization (2 hours)

### Step 1: Create Next.js Project

```bash
# Create project with App Router
npx create-next-app@14 researchhub \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd researchhub
```

**Checkpoint**: ✅ `npm run dev` should start server at localhost:3000

---

### Step 2: Install Core Dependencies

```bash
# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install next-auth
npm install bcryptjs
npm install -D @types/bcryptjs

# Email (Magic Links)
npm install resend

# File Processing
npm install crypto

# Validation
npm install zod

# State Management
npm install @tanstack/react-query zustand

# UI Components
npm install react-simplemde-editor easymde
npm install lucide-react # Icons

# Analytics
npm install posthog-js posthog-node

# Dev Tools
npm install -D @types/node
```

**Checkpoint**: ✅ All dependencies installed without errors

---

### Step 3: Setup PostgreSQL Database

```bash
# Start PostgreSQL container
docker run -d \
  --name researchhub-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=researchhub_dev \
  -v researchhub-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# Verify running
docker ps | grep researchhub-db
```

**Checkpoint**: ✅ Container running on port 5432

---

### Step 4: Configure Environment Variables

Create `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://postgres:devpassword@localhost:5432/researchhub_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-this-with-openssl-rand-base64-32"

# Google OAuth (create at console.cloud.google.com)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# LinkedIn OAuth (create at linkedin.com/developers)
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# Resend (get from resend.com)
RESEND_API_KEY="re_your_api_key"

# LlamaParse (get from cloud.llamaindex.ai)
LLAMA_CLOUD_API_KEY="llx-your-api-key"

# PostHog (get from posthog.com)
NEXT_PUBLIC_POSTHOG_KEY="phc_your_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# File Storage
STORAGE_PATH="./storage"
```

**Checkpoint**: ✅ `.env.local` created with all variables

---

### Step 5: Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (we're using .env.local instead)
```

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  reports  Report[]
  sessions Session[]

  @@map("users")
}

model Session {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  sessionToken String   @unique @map("session_token")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model Report {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  name      String
  content   String    @default("")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  documents  Document[]
  reportTags ReportTag[]

  @@index([userId, createdAt])
  @@map("reports")
}

model Document {
  id             String    @id @default(uuid()) @db.Uuid
  reportId       String    @map("report_id") @db.Uuid
  filename       String
  fileHash       String    @map("file_hash")
  storagePath    String    @map("storage_path")
  parsedContent  String?   @map("parsed_content") @db.Text
  notes          String    @default("")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  report       Report        @relation(fields: [reportId], references: [id], onDelete: Cascade)
  documentTags DocumentTag[]

  @@unique([reportId, fileHash])
  @@index([reportId])
  @@map("documents")
}

model ReportTag {
  id       String @id @default(uuid()) @db.Uuid
  reportId String @map("report_id") @db.Uuid
  tag      String

  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@unique([reportId, tag])
  @@index([reportId])
  @@map("report_tags")
}

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

Run migration:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Checkpoint**: ✅ Database tables created, Prisma client generated

---

## Phase 1: Core Infrastructure (6 hours)

### Step 6: Create Project Structure

```bash
mkdir -p \
  app/\(auth\)/login \
  app/\(auth\)/signup \
  app/\(app\)/reports \
  app/api/auth/\[...nextauth\] \
  app/api/reports \
  app/api/documents \
  app/api/search \
  components/reports \
  components/documents \
  components/shared \
  domain/entities \
  domain/errors \
  services \
  repositories/interfaces \
  repositories/implementations \
  hooks \
  lib \
  types \
  stores \
  storage
```

**Checkpoint**: ✅ Folder structure created

---

### Step 7: Setup Prisma Client Singleton

Create `lib/db.ts`:

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

**Checkpoint**: ✅ Database client ready

---

### Step 8: Create Domain Entities

Create `domain/entities/Report.ts`:

```typescript
import { z } from 'zod';

export const ReportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, 'Report name is required').max(200),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Report = z.infer<typeof ReportSchema>;

export class ReportEntity {
  constructor(private data: Report) {}

  static create(params: {
    userId: string;
    name: string;
    content?: string;
  }): Report {
    return {
      id: crypto.randomUUID(),
      userId: params.userId,
      name: params.name.trim(),
      content: params.content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }

  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name;
  }

  updateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Report name cannot be empty');
    }
    this.data.name = name.trim();
    this.data.updatedAt = new Date();
  }

  updateContent(content: string): void {
    this.data.content = content;
    this.data.updatedAt = new Date();
  }

  toJSON(): Report {
    return { ...this.data };
  }
}
```

Create `domain/entities/Document.ts`:

```typescript
import { z } from 'zod';

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  filename: z.string().min(1),
  fileHash: z.string().length(64), // SHA-256
  storagePath: z.string(),
  parsedContent: z.string().nullable(),
  notes: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Document = z.infer<typeof DocumentSchema>;

export class DocumentEntity {
  constructor(private data: Document) {}

  static create(params: {
    reportId: string;
    filename: string;
    fileHash: string;
    storagePath: string;
    parsedContent?: string;
  }): Document {
    return {
      id: crypto.randomUUID(),
      reportId: params.reportId,
      filename: params.filename,
      fileHash: params.fileHash,
      storagePath: params.storagePath,
      parsedContent: params.parsedContent || null,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }

  get id() {
    return this.data.id;
  }

  get filename() {
    return this.data.filename;
  }

  updateNotes(notes: string): void {
    this.data.notes = notes;
    this.data.updatedAt = new Date();
  }

  toJSON(): Document {
    return { ...this.data };
  }
}
```

**Checkpoint**: ✅ Domain entities created with validation

---

### Step 9: Create Repository Interfaces

Create `repositories/interfaces/IReportRepository.ts`:

```typescript
import { Report } from '@/domain/entities/Report';

export interface IReportRepository {
  findById(id: string): Promise<Report | null>;
  findByUserId(userId: string): Promise<Report[]>;
  save(report: Report): Promise<void>;
  delete(id: string): Promise<void>;
  search(userId: string, query: string): Promise<Report[]>;
}
```

Create `repositories/interfaces/IDocumentRepository.ts`:

```typescript
import { Document } from '@/domain/entities/Document';

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByReportId(reportId: string): Promise<Document[]>;
  findByHash(reportId: string, fileHash: string): Promise<Document | null>;
  save(document: Document): Promise<void>;
  delete(id: string): Promise<void>;
  search(reportId: string, query: string): Promise<Document[]>;
}
```

**Checkpoint**: ✅ Repository interfaces defined

---

### Step 10: Implement Repositories

Create `repositories/implementations/PrismaReportRepository.ts`:

```typescript
import { prisma } from '@/lib/db';
import { Report } from '@/domain/entities/Report';
import { IReportRepository } from '../interfaces/IReportRepository';

export class PrismaReportRepository implements IReportRepository {
  async findById(id: string): Promise<Report | null> {
    const report = await prisma.report.findUnique({
      where: { id, deletedAt: null },
    });

    return report ? this.toDomain(report) : null;
  }

  async findByUserId(userId: string): Promise<Report[]> {
    const reports = await prisma.report.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });

    return reports.map(this.toDomain);
  }

  async save(report: Report): Promise<void> {
    await prisma.report.upsert({
      where: { id: report.id },
      create: {
        id: report.id,
        userId: report.userId,
        name: report.name,
        content: report.content,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
      update: {
        name: report.name,
        content: report.content,
        updatedAt: report.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.report.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async search(userId: string, query: string): Promise<Report[]> {
    const reports = await prisma.report.findMany({
      where: {
        userId,
        deletedAt: null,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return reports.map(this.toDomain);
  }

  private toDomain(row: any): Report {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
```

Create similar implementation for `PrismaDocumentRepository.ts` (follow same pattern).

**Checkpoint**: ✅ Repositories implemented

---

## Phase 2: Business Logic (8 hours)

### Step 11: Create Services

Create `services/ReportService.ts`:

```typescript
import { Report, ReportEntity } from '@/domain/entities/Report';
import { IReportRepository } from '@/repositories/interfaces/IReportRepository';

export class ReportService {
  constructor(private reportRepository: IReportRepository) {}

  async createReport(userId: string, name: string): Promise<Report> {
    const report = ReportEntity.create({ userId, name });
    await this.reportRepository.save(report);
    return report;
  }

  async getReport(id: string, userId: string): Promise<Report> {
    const report = await this.reportRepository.findById(id);

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return report;
  }

  async listReports(userId: string): Promise<Report[]> {
    return this.reportRepository.findByUserId(userId);
  }

  async updateReport(
    id: string,
    userId: string,
    updates: { name?: string; content?: string }
  ): Promise<Report> {
    const report = await this.getReport(id, userId);
    const entity = new ReportEntity(report);

    if (updates.name) entity.updateName(updates.name);
    if (updates.content !== undefined) entity.updateContent(updates.content);

    const updated = entity.toJSON();
    await this.reportRepository.save(updated);
    return updated;
  }

  async deleteReport(id: string, userId: string): Promise<void> {
    const report = await this.getReport(id, userId);
    await this.reportRepository.delete(report.id);
  }

  async searchReports(userId: string, query: string): Promise<Report[]> {
    return this.reportRepository.search(userId, query);
  }
}
```

Create `services/DocumentService.ts`:

```typescript
import { Document, DocumentEntity } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/repositories/interfaces/IDocumentRepository';
import { FileStorageService } from './FileStorageService';
import { ParserService } from './ParserService';
import crypto from 'crypto';
import fs from 'fs';

export class DocumentService {
  constructor(
    private documentRepository: IDocumentRepository,
    private storageService: FileStorageService,
    private parserService: ParserService
  ) {}

  async uploadDocument(
    reportId: string,
    file: File | Buffer,
    filename: string
  ): Promise<Document> {
    // Calculate file hash
    const fileHash = await this.calculateHash(file);

    // Check for duplicate
    const existing = await this.documentRepository.findByHash(reportId, fileHash);
    if (existing) {
      throw new Error('Document already exists in this report');
    }

    // Store file
    const storagePath = await this.storageService.saveFile(reportId, fileHash, file, filename);

    // Parse content (async, non-blocking in production)
    let parsedContent: string | undefined;
    try {
      parsedContent = await this.parserService.parse(file, filename);
    } catch (error) {
      console.error('Parsing failed:', error);
      // Continue without parsed content
    }

    // Create document
    const document = DocumentEntity.create({
      reportId,
      filename,
      fileHash,
      storagePath,
      parsedContent,
    });

    await this.documentRepository.save(document);
    return document;
  }

  async getDocument(id: string): Promise<Document> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }
    return document;
  }

  async listDocuments(reportId: string): Promise<Document[]> {
    return this.documentRepository.findByReportId(reportId);
  }

  async updateDocument(
    id: string,
    updates: { filename?: string; notes?: string }
  ): Promise<Document> {
    const document = await this.getDocument(id);
    const entity = new DocumentEntity(document);

    if (updates.notes !== undefined) entity.updateNotes(updates.notes);

    const updated = entity.toJSON();
    await this.documentRepository.save(updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.getDocument(id);

    // Delete file
    await this.storageService.deleteFile(document.storagePath);

    // Delete record
    await this.documentRepository.delete(id);
  }

  async searchDocuments(reportId: string, query: string): Promise<Document[]> {
    return this.documentRepository.search(reportId, query);
  }

  private async calculateHash(file: File | Buffer): Promise<string> {
    const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
```

**Checkpoint**: ✅ Service layer implemented

---

### Step 12: Create Storage Service

Create `services/FileStorageService.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';

export class FileStorageService {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH || './storage';
  }

  async saveFile(
    reportId: string,
    fileHash: string,
    file: File | Buffer,
    filename: string
  ): Promise<string> {
    // Create directory structure
    const dir = path.join(this.basePath, reportId);
    await fs.mkdir(dir, { recursive: true });

    // Get file extension
    const ext = path.extname(filename);
    const storagePath = path.join(dir, `${fileHash}${ext}`);

    // Write file
    const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
    await fs.writeFile(storagePath, buffer);

    return storagePath;
  }

  async getFile(storagePath: string): Promise<Buffer> {
    return fs.readFile(storagePath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      await fs.unlink(storagePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  async fileExists(storagePath: string): Promise<boolean> {
    try {
      await fs.access(storagePath);
      return true;
    } catch {
      return false;
    }
  }
}
```

**Checkpoint**: ✅ File storage service created

---

### Step 13: Create Parser Service

Create `services/ParserService.ts`:

```typescript
export class ParserService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LLAMA_CLOUD_API_KEY || '';
  }

  async parse(file: File | Buffer, filename: string): Promise<string> {
    // Skip parsing for images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (imageExtensions.includes(ext)) {
      return 'Image file - no text extraction';
    }

    try {
      // Upload to LlamaParse
      const formData = new FormData();
      const blob = file instanceof Buffer ? new Blob([file]) : file;
      formData.append('file', blob, filename);
      formData.append('mode', 'fast');

      const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      const { id: jobId } = await uploadResponse.json();

      // Poll for completion
      let status = 'PENDING';
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds max

      while (status === 'PENDING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}`,
          {
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
          }
        );

        const statusData = await statusResponse.json();
        status = statusData.status;
        attempts++;
      }

      if (status === 'SUCCESS') {
        // Get result
        const resultResponse = await fetch(
          `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}/result/raw/markdown`,
          {
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
          }
        );

        return await resultResponse.text();
      } else {
        throw new Error(`Parsing failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Parser error:', error);
      return '';
    }
  }
}
```

**Checkpoint**: ✅ Parser service created

---

## Phase 3: API Routes (8 hours)

### Step 14: Create Authentication

Create `lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'linkedin') {
        // Check if user exists
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser) {
          // Create user
          dbUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || 'Anonymous',
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**Checkpoint**: ✅ Authentication configured

---

### Step 15: Create Report API Routes

Create `app/api/reports/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReportService } from '@/services/ReportService';
import { PrismaReportRepository } from '@/repositories/implementations/PrismaReportRepository';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reportService = new ReportService(new PrismaReportRepository());
  const reports = await reportService.listReports(session.user.id);

  return NextResponse.json(reports);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const reportService = new ReportService(new PrismaReportRepository());
  const report = await reportService.createReport(session.user.id, name);

  return NextResponse.json(report, { status: 201 });
}
```

Create `app/api/reports/[id]/route.ts` for GET, PATCH, DELETE operations (similar pattern).

**Checkpoint**: ✅ Report API routes created

---

### Step 16: Create Document API Routes

Create `app/api/documents/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentService } from '@/services/DocumentService';
import { PrismaDocumentRepository } from '@/repositories/implementations/PrismaDocumentRepository';
import { FileStorageService } from '@/services/FileStorageService';
import { ParserService } from '@/services/ParserService';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const reportId = formData.get('reportId') as string;

  if (!file || !reportId) {
    return NextResponse.json(
      { error: 'File and reportId are required' },
      { status: 400 }
    );
  }

  // Validate file type
  const allowedTypes = ['text/plain', 'text/markdown'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only TXT and MD files are supported' },
      { status: 400 }
    );
  }

  const documentService = new DocumentService(
    new PrismaDocumentRepository(),
    new FileStorageService(),
    new ParserService()
  );

  try {
    const document = await documentService.uploadDocument(reportId, file, file.name);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
```

**Checkpoint**: ✅ Document API routes created

---

## Phase 4: Frontend Components (12 hours)

### Step 17: Create Custom Hooks

Create `hooks/useReports.ts`:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Report } from '@/domain/entities/Report';

export function useReports() {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json() as Promise<Report[]>;
    },
  });

  const createReport = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create report');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update report');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete report');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return {
    reports,
    isLoading,
    createReport,
    updateReport,
    deleteReport,
  };
}
```

Create similar `hooks/useDocuments.ts` for document operations.

**Checkpoint**: ✅ Custom hooks created

---

### Step 18: Create Report Components

Create `components/reports/ReportList.tsx`:

```typescript
'use client';

import { useReports } from '@/hooks/useReports';
import { ReportCard } from './ReportCard';
import { Button } from '@/components/shared/Button';
import { useState } from 'react';

export function ReportList() {
  const { reports, isLoading, createReport } = useReports();
  const [showCreate, setShowCreate] = useState(false);
  const [newReportName, setNewReportName] = useState('');

  const handleCreate = async () => {
    if (!newReportName.trim()) return;
    await createReport.mutateAsync(newReportName);
    setNewReportName('');
    setShowCreate(false);
  };

  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={() => setShowCreate(true)}>+ New Report</Button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 border rounded-lg">
          <input
            type="text"
            value={newReportName}
            onChange={(e) => setNewReportName(e.target.value)}
            placeholder="Report name..."
            className="w-full p-2 border rounded"
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <Button onClick={handleCreate}>Create</Button>
            <Button onClick={() => setShowCreate(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
```

Create `components/reports/ReportCard.tsx`:

```typescript
'use client';

import { Report } from '@/domain/entities/Report';
import Link from 'next/link';

interface Props {
  report: Report;
}

export function ReportCard({ report }: Props) {
  return (
    <Link href={`/reports/${report.id}`}>
      <div className="p-4 border rounded-lg hover:shadow-lg transition-shadow">
        <h3 className="font-semibold text-lg">{report.name}</h3>
        <p className="text-sm text-gray-500 mt-2">
          Updated {new Date(report.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
```

**Checkpoint**: ✅ Report components created

---

### Step 19: Create Report Editor

Create `components/reports/ReportEditor.tsx`:

```typescript
'use client';

import { useReport } from '@/hooks/useReports';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useState } from 'react';

interface Props {
  reportId: string;
}

export function ReportEditor({ reportId }: Props) {
  const { report, updateReport } = useReport(reportId);
  const [content, setContent] = useState(report?.content || '');
  const debouncedContent = useDebounce(content, 1000);

  useEffect(() => {
    if (debouncedContent && debouncedContent !== report?.content) {
      updateReport.mutate({ id: reportId, data: { content: debouncedContent } });
    }
  }, [debouncedContent]);

  if (!report) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">{report.name}</h1>
      </div>
      <div className="flex-1 p-4">
        <SimpleMDE
          value={content}
          onChange={setContent}
          options={{
            spellChecker: false,
            autosave: { enabled: false },
            placeholder: 'Start writing your report...',
          }}
        />
      </div>
    </div>
  );
}
```

**Checkpoint**: ✅ Report editor created

---

### Step 20: Create Document Components

Create `components/documents/DocumentUpload.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/shared/Button';

interface Props {
  reportId: string;
}

export function DocumentUpload({ reportId }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const { uploadDocument } = useDocuments(reportId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', reportId);

      await uploadDocument.mutateAsync(formData);
    }
    setFiles([]);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-4">Upload Documents</h3>

      <input
        type="file"
        multiple
        accept=".txt,.md"
        onChange={handleFileChange}
        className="mb-4"
      />

      {files.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">{files.length} file(s) selected</p>
          <ul className="text-sm">
            {files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={files.length === 0 || uploadDocument.isPending}
      >
        {uploadDocument.isPending ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  );
}
```

**Checkpoint**: ✅ Document upload component created

---

## Phase 5: Pages & Routing (6 hours)

### Step 21: Create Login Page

Create `app/(auth)/login/page.tsx`:

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/shared/Button';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 border rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Sign in to ResearchHub</h1>

        <div className="space-y-4">
          <Button
            onClick={() => signIn('google', { callbackUrl: '/reports' })}
            className="w-full"
          >
            Sign in with Google
          </Button>

          <Button
            onClick={() => signIn('linkedin', { callbackUrl: '/reports' })}
            className="w-full"
          >
            Sign in with LinkedIn
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Checkpoint**: ✅ Login page created

---

### Step 22: Create Reports Page

Create `app/(app)/reports/page.tsx`:

```typescript
import { ReportList } from '@/components/reports/ReportList';

export default function ReportsPage() {
  return <ReportList />;
}
```

Create `app/(app)/reports/[id]/page.tsx`:

```typescript
import { ReportEditor } from '@/components/reports/ReportEditor';
import { DocumentList } from '@/components/documents/DocumentList';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen flex">
      <div className="flex-1 border-r">
        <ReportEditor reportId={params.id} />
      </div>
      <div className="w-96">
        <DocumentList reportId={params.id} />
      </div>
    </div>
  );
}
```

**Checkpoint**: ✅ Pages created

---

### Step 23: Create App Layout

Create `app/(app)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.Node }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <nav className="border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">ResearchHub</h1>
          <div className="flex items-center gap-4">
            <span>{session.user?.name}</span>
            <button onClick={() => signOut()}>Sign Out</button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

**Checkpoint**: ✅ Layout with authentication complete

---

## Phase 6: Testing & Refinement (8 hours)

### Step 24: Manual Testing Checklist

- [ ] User can sign in with Google
- [ ] User can sign in with LinkedIn
- [ ] User can create a report
- [ ] User can edit report content (markdown)
- [ ] Content auto-saves (wait 1 second, refresh, content persists)
- [ ] User can upload TXT file
- [ ] User can upload MD file
- [ ] Duplicate upload shows error
- [ ] Uploaded file appears in document list
- [ ] User can view parsed content
- [ ] User can search documents by filename
- [ ] User can delete document
- [ ] User can delete report
- [ ] User can sign out

**Checkpoint**: ✅ All manual tests pass

---

### Step 25: Write Unit Tests

Create `__tests__/services/ReportService.test.ts`:

```typescript
import { ReportService } from '@/services/ReportService';
import { IReportRepository } from '@/repositories/interfaces/IReportRepository';

describe('ReportService', () => {
  let service: ReportService;
  let mockRepo: jest.Mocked<IReportRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    };
    service = new ReportService(mockRepo);
  });

  describe('createReport', () => {
    it('should create a report with valid name', async () => {
      const report = await service.createReport('user-123', 'My Report');

      expect(report.name).toBe('My Report');
      expect(report.userId).toBe('user-123');
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Report',
        userId: 'user-123',
      }));
    });

    it('should trim report name', async () => {
      const report = await service.createReport('user-123', '  My Report  ');
      expect(report.name).toBe('My Report');
    });
  });

  describe('getReport', () => {
    it('should throw error if report not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.getReport('report-123', 'user-123')
      ).rejects.toThrow('Report not found');
    });

    it('should throw error if unauthorized', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'report-123',
        userId: 'other-user',
        name: 'Report',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(
        service.getReport('report-123', 'user-123')
      ).rejects.toThrow('Unauthorized');
    });
  });
});
```

Run tests:

```bash
npm test
```

**Checkpoint**: ✅ Unit tests passing

---

## Phase 7: Final Polish (4 hours)

### Step 26: Add Error Handling

Create `lib/errors.ts`:

```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateError';
  }
}
```

Update services to use custom errors.

**Checkpoint**: ✅ Error handling improved

---

### Step 27: Add Loading States

Add loading spinners and skeletons throughout UI.

**Checkpoint**: ✅ Loading states added

---

### Step 28: Add Analytics

Create `lib/analytics.ts`:

```typescript
import posthog from 'posthog-js';

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });
  }
}

export function trackEvent(event: string, properties?: any) {
  posthog.capture(event, properties);
}
```

Add to `app/layout.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';

export default function RootLayout({ children }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Checkpoint**: ✅ Analytics tracking added

---

## Final Deployment Checklist

### Pre-Launch

- [ ] All environment variables configured
- [ ] OAuth apps created (Google, LinkedIn)
- [ ] Resend API key obtained and tested
- [ ] LlamaParse API key obtained and tested
- [ ] PostHog project created
- [ ] Database migrations applied
- [ ] Sample data seeded
- [ ] Storage directory created and writable

### Functionality

- [ ] User authentication works (all 3 methods)
- [ ] Create/edit/delete reports
- [ ] Upload/view/delete documents
- [ ] File parsing works (LlamaParse)
- [ ] Search works (filename)
- [ ] Tags work (add/remove)
- [ ] Analytics tracking works (PostHog)
- [ ] Error handling works (try invalid inputs)
- [ ] Loading states visible

### Code Quality

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Unit tests pass (`npm test`)
- [ ] No console errors in browser
- [ ] Performance acceptable (Lighthouse score > 80)

### Documentation

- [ ] README.md updated with setup instructions
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment notes added

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep researchhub-db

# Check logs
docker logs researchhub-db

# Restart container
docker restart researchhub-db

# Test connection
psql postgresql://postgres:devpassword@localhost:5432/researchhub_dev
```

### OAuth Errors

- Verify redirect URLs match exactly (http vs https, port)
- Check Google Cloud Console → APIs & Services → Credentials
- Check LinkedIn Developers → My Apps → Auth
- Ensure `NEXTAUTH_URL` matches your development URL

### File Upload Errors

```bash
# Check storage directory permissions
ls -la ./storage

# Create if missing
mkdir -p ./storage
chmod 755 ./storage
```

### LlamaParse API Errors

- Verify API key is correct
- Check quota at cloud.llamaindex.ai
- Check file type is supported (TXT, MD for NOW phase)

---

## Next Steps

After completing the NOW phase:

1. **User Testing** - Get 5 target users to test
2. **Feedback Collection** - Track pain points and feature requests
3. **Bug Fixes** - Address critical issues
4. **NEXT Phase Planning** - Prepare for cloud deployment

---

## Appendix: Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                      # Start production server

# Database
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Run new migration
npx prisma db seed             # Seed data
npx prisma generate            # Regenerate Prisma client

# Testing
npm test                       # Run all tests
npm test -- --watch            # Watch mode
npm test -- --coverage         # Coverage report

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier

# Docker
docker ps                      # List running containers
docker logs researchhub-db     # View logs
docker restart researchhub-db  # Restart database
docker stop researchhub-db     # Stop database
```

---

**END OF DEVELOPER GUIDE**

**Estimated Total Time**: 40-60 hours for complete NOW phase MVP

**Ready to Start**: All specifications, decisions, and instructions are complete!
