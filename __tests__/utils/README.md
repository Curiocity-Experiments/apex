# Test Utilities

## Quick Start

**Before writing tests, read**: [docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md](../../docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md)

## Available Utilities

### Mocks (`__tests__/utils/mocks.ts`)

- `prismaMock` - Mocked Prisma client
- `mockSession` - NextAuth session mock
- `mockReportRepository` - Repository mock functions
- `mockDocumentRepository` - Repository mock functions

### Factories (`__tests__/utils/factories.ts`)

- `createMockReport(overrides)` - Generate test reports
- `createMockDocument(overrides)` - Generate test documents
- `createMockUser(overrides)` - Generate test users
- `createMockReports(count, overrides)` - Generate multiple reports

### Database (`__tests__/utils/db/`)

- `prisma-mock.ts` - Prisma client mocking utilities
- `test-db.ts` - Test database setup/teardown

## Testing Guidelines

### ✅ DO: Test Behavior

```typescript
it('should return active reports', async () => {
  const mockReports = [{ id: 'r1', deletedAt: null }];
  prismaMock.report.findMany.mockResolvedValue(mockReports);

  const result = await repository.findByUserId('user-123');

  // Test BEHAVIOR: verify returned data
  expect(result).toHaveLength(1);
  expect(result[0].deletedAt).toBeNull();
});
```

### ❌ DON'T: Test Implementation

```typescript
it('should call Prisma correctly', async () => {
  await repository.findByUserId('user-123');

  // ❌ Testing HOW, not WHAT
  expect(prismaMock.report.findMany).toHaveBeenCalledWith({
    where: { userId: 'user-123', deletedAt: null },
  });
});
```

## Examples

See actual tests for reference:

- Domain: `__tests__/domain/entities/Report.test.ts`
- Repositories: `__tests__/infrastructure/repositories/PrismaReportRepository.test.ts`
- Interfaces: `__tests__/domain/repositories/ReportRepository.test.ts`
