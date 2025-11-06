# Test Utilities

**Quick Start**: Read [docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md](../../docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md) before writing tests.

## Available Utilities

### Mocks (`mocks.ts`)

- `prismaMock` - Mocked Prisma client
- `mockSession` - NextAuth session mock
- `mockReportRepository` - Repository mock functions
- `mockDocumentRepository` - Repository mock functions

### Factories (`factories.ts`)

- `createMockReport(overrides)` - Generate test reports
- `createMockDocument(overrides)` - Generate test documents
- `createMockUser(overrides)` - Generate test users
- `createMockReports(count, overrides)` - Generate multiple reports

### Database (`db/`)

- `prisma-mock.ts` - Prisma client mocking utilities
- `test-db.ts` - Test database setup/teardown

## Example Tests

See actual tests for reference patterns:

- Domain: `__tests__/domain/entities/Report.test.ts`
- Repositories: `__tests__/infrastructure/repositories/PrismaReportRepository.test.ts`
- Interfaces: `__tests__/domain/repositories/ReportRepository.test.ts`
