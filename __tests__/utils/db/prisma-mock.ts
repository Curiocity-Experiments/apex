/**
 * Prisma Client Mock for Repository Tests
 *
 * Provides a mocked Prisma client for testing repositories
 * without needing a real database connection.
 *
 * @see docs/TDD-GUIDE.md Section 3.2 (Repository Layer Testing)
 */

import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// Create a deep mock of Prisma Client
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

let prismaMock: MockPrismaClient;

/**
 * Get mocked Prisma client
 * Resets before each test via beforeEach
 */
export function getMockPrisma(): MockPrismaClient {
  if (!prismaMock) {
    prismaMock = mockDeep<PrismaClient>();
  }
  return prismaMock;
}

/**
 * Reset Prisma mock
 * Called automatically before each test
 */
export function resetPrismaMock(): void {
  if (prismaMock) {
    mockReset(prismaMock);
  }
}

// Auto-reset before each test
beforeEach(() => {
  resetPrismaMock();
});
