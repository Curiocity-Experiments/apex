// Add custom jest matchers from jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock environment variables for tests
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-min-32-characters-long!!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/apex_test';

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(), // Silence console.error in tests
  warn: jest.fn(), // Silence console.warn in tests
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
