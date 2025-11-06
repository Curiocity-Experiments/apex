/**
 * Common mocks for Apex tests
 * Reference: docs/TDD-GUIDE.md
 */

import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// ============================================================================
// Prisma Mock
// ============================================================================

export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

// ============================================================================
// NextAuth Session Mock
// ============================================================================

export const mockSession = (
  user?: { id: string; email: string; name?: string } | null,
) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useSession } = require('next-auth/react');

  if (user) {
    (useSession as jest.Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
  } else {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
  }
};

export const mockServerSession = (
  user?: { id: string; email: string; name?: string } | null,
) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getServerSession } = require('next-auth');

  if (user) {
    (getServerSession as jest.Mock).mockResolvedValue({
      user,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } else {
    (getServerSession as jest.Mock).mockResolvedValue(null);
  }
};

// ============================================================================
// File Upload Mock
// ============================================================================

export const mockFile = (
  name: string,
  type: string,
  content: string | Buffer,
): File => {
  const buffer = typeof content === 'string' ? Buffer.from(content) : content;
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
};

// ============================================================================
// Repository Mocks
// ============================================================================

export const mockReportRepository = () => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
});

export const mockDocumentRepository = () => ({
  findById: jest.fn(),
  findByReportId: jest.fn(),
  findByHash: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
});

// ============================================================================
// Service Mocks
// ============================================================================

export const mockFileStorageService = () => ({
  saveFile: jest.fn(),
  getFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(),
});

export const mockParserService = () => ({
  parse: jest.fn(),
});

// ============================================================================
// HTTP Request/Response Mocks
// ============================================================================

export const mockRequest = (
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {},
) => {
  const request = {
    method: options.method || 'GET',
    url: options.url || 'http://localhost:3000',
    headers: new Headers(options.headers || {}),
    json: async () => options.body || {},
    formData: async () => {
      const fd = new FormData();
      if (options.body) {
        Object.entries(options.body).forEach(([key, value]) => {
          fd.append(key, value as any);
        });
      }
      return fd;
    },
  } as Request;

  return request;
};

// ============================================================================
// React Query Mocks
// ============================================================================

export const mockQueryClient = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { QueryClient } = require('@tanstack/react-query');
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// ============================================================================
// Date/Time Mocks
// ============================================================================

export const mockDate = (isoString: string) => {
  const mockDate = new Date(isoString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  return mockDate;
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

// ============================================================================
// Crypto Mocks (for deterministic UUIDs in tests)
// ============================================================================

export const mockCrypto = () => {
  let counter = 0;
  const original = global.crypto;

  global.crypto = {
    ...original,
    randomUUID: () => {
      counter++;
      return `00000000-0000-0000-0000-${counter.toString().padStart(12, '0')}`;
    },
  } as any;

  return () => {
    global.crypto = original;
  };
};

// ============================================================================
// Console Mocks
// ============================================================================

export const silenceConsole = () => {
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
};

export const restoreConsole = () => {
  jest.restoreAllMocks();
};
