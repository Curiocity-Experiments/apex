/**
 * Test Database Utilities
 *
 * Provides database setup/teardown for integration tests.
 * Uses SQLite for speed and isolation.
 *
 * @see docs/TDD-GUIDE.md Section 3.2 (Repository Layer Testing)
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Use in-memory SQLite for tests
const TEST_DATABASE_URL = 'file:./test.db';

let prisma: PrismaClient | null = null;

/**
 * Get or create test database client
 */
export function getTestDb(): PrismaClient {
  if (!prisma) {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL,
        },
      },
      log: [], // Silence logs in tests
    });
  }
  return prisma;
}

/**
 * Initialize test database schema
 * Runs migrations to set up tables
 */
export async function setupTestDb(): Promise<PrismaClient> {
  const db = getTestDb();

  // Clean up existing database
  await cleanupTestDb();

  // Run migrations using Prisma CLI
  // Note: This creates the schema based on prisma/schema.prisma
  try {
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'ignore',
    });
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }

  return db;
}

/**
 * Clean all data from database tables
 * Keeps schema intact, removes all rows
 */
export async function cleanTestDb(): Promise<void> {
  const db = getTestDb();

  // Delete in correct order to respect foreign keys
  await db.documentTag.deleteMany({});
  await db.reportTag.deleteMany({});
  await db.document.deleteMany({});
  await db.report.deleteMany({});
  await db.session.deleteMany({});
  await db.user.deleteMany({});
}

/**
 * Teardown test database
 * Disconnects and removes database file
 */
export async function cleanupTestDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }

  // Remove SQLite file if it exists
  const dbPath = path.join(process.cwd(), 'test.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const dbPathJournal = path.join(process.cwd(), 'test.db-journal');
  if (fs.existsSync(dbPathJournal)) {
    fs.unlinkSync(dbPathJournal);
  }
}

/**
 * Seed test database with sample data
 * Useful for testing queries and relationships
 */
export async function seedTestDb() {
  const db = getTestDb();

  // Create test user
  const user = await db.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
  });

  // Create test report
  const report = await db.report.create({
    data: {
      id: 'test-report-1',
      userId: user.id,
      name: 'Test Report',
      content: '# Test Content',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
  });

  // Create test document
  await db.document.create({
    data: {
      id: 'test-doc-1',
      reportId: report.id,
      filename: 'test.pdf',
      fileHash: 'testhash123',
      storagePath: '/storage/test.pdf',
      parsedContent: '# Parsed Test Content',
      notes: 'Test notes',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
  });

  return { user, report };
}

/**
 * Helper to execute database operations in a transaction
 * Automatically rolls back after test
 */
export async function withTransaction<T>(
  callback: (db: PrismaClient) => Promise<T>,
): Promise<T> {
  const db = getTestDb();
  let result: T;

  await db
    .$transaction(async (tx) => {
      result = await callback(tx as PrismaClient);
      // Transaction will auto-rollback after test
      throw new Error('ROLLBACK'); // Force rollback
    })
    .catch((error) => {
      if (error.message !== 'ROLLBACK') {
        throw error;
      }
    });

  return result!;
}
