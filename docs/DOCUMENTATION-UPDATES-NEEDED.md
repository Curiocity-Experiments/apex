# Documentation Updates Required

**Date**: 2025-11-06
**Context**: Ensuring behavior-focused testing is documented
**Related Commit**: `94dd827` - Refactored tests to be behavior-focused

---

## ✅ Completed

- [x] Created `docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md` - Comprehensive guide
- [x] Updated test file headers with behavior-focused comments
- [x] Refactored actual tests to demonstrate patterns

---

## 📋 Still Needed

### 1. Update `docs/TDD-GUIDE.md`

**Location**: Lines 430-540 (Section 3.2 - Repository Testing)

**Current State**: Shows implementation-focused examples with `toHaveBeenCalledWith`

**Required Changes**:

#### A. Add Reference to New Guide (after Table of Contents)

```markdown
## Important: Behavior vs Implementation Testing

**⚠️ CRITICAL**: Before writing tests, read [TDD-BEHAVIOR-VS-IMPLEMENTATION.md](./TDD-BEHAVIOR-VS-IMPLEMENTATION.md)

**TL;DR**:

- ✅ Test WHAT is returned (behavior)
- ❌ Don't test HOW it's done (implementation)
- 95% of tests should be behavior-focused
- Only integration tests should test implementation

See the dedicated guide for examples and patterns.
```

#### B. Update Section 3.2 Examples

Replace lines 438-530 with behavior-focused examples:

**OLD** (Implementation-focused):

```typescript
expect(prismaMock.report.findUnique).toHaveBeenCalledWith({
  where: { id: 'report-123', deletedAt: null },
});
```

**NEW** (Behavior-focused):

```typescript
// Test BEHAVIOR: verify correct data is returned
expect(result).not.toBeNull();
expect(result?.id).toBe('report-123');
expect(result?.deletedAt).toBeNull();
```

Full replacement text:

```typescript
// repositories/__tests__/PrismaReportRepository.test.ts
import { PrismaReportRepository } from '@/infrastructure/repositories/PrismaReportRepository';
import { getMockPrisma } from '@/__tests__/utils/db/prisma-mock';

/**
 * IMPORTANT: These tests focus on BEHAVIOR (what is returned),
 * not IMPLEMENTATION (how Prisma is called).
 *
 * See: docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 */
describe('PrismaReportRepository', () => {
  let repository: PrismaReportRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = getMockPrisma();
    repository = new PrismaReportRepository(prismaMock);
  });

  describe('findById', () => {
    it('should return report when found', async () => {
      const mockReport = {
        id: 'report-123',
        userId: 'user-123',
        name: 'Test Report',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaMock.report.findUnique.mockResolvedValue(mockReport);

      const result = await repository.findById('report-123');

      // ✅ Test BEHAVIOR: verify correct data is returned
      expect(result).not.toBeNull();
      expect(result?.id).toBe('report-123');
      expect(result?.name).toBe('Test Report');
    });

    it('should return null when not found', async () => {
      prismaMock.report.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      // ✅ Test BEHAVIOR: null when not found
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should exclude deleted reports by default', async () => {
      const activeReport = {
        id: 'report-1',
        userId: 'user-123',
        name: 'Active',
        deletedAt: null,
        /* ... */
      };

      // Mock returns only active reports
      prismaMock.report.findMany.mockResolvedValue([activeReport]);

      const result = await repository.findByUserId('user-123');

      // ✅ Test BEHAVIOR: only active reports returned
      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();
      expect(result[0].name).toBe('Active');
    });
  });
});
```

#### C. Update Service Layer Examples

Lines 654, 719, 755 - Replace with behavior-focused patterns:

**Before**:

```typescript
expect(mockRepo.save).toHaveBeenCalledWith(
  expect.objectContaining({ name: 'New Report' }),
);
```

**After**:

```typescript
// ✅ Test BEHAVIOR: verify service returns correct result
const result = await service.createReport({ name: 'New Report' });
expect(result.name).toBe('New Report');
expect(result.id).toBeDefined();
```

#### D. Add Testing Anti-Patterns Section

Add new section after "Troubleshooting & FAQ":

````markdown
## 11. Testing Anti-Patterns

### ❌ Anti-Pattern 1: Testing Implementation

**Problem**:

```typescript
// ❌ DON'T: Test how Prisma is called
expect(prismaMock.report.findMany).toHaveBeenCalledWith({
  where: { userId: 'user-123', deletedAt: null },
});
```
````

**Solution**:

```typescript
// ✅ DO: Test what is returned
expect(result).toHaveLength(2);
expect(result[0].userId).toBe('user-123');
```

**Why**: Implementation tests break on refactoring, behavior tests don't.

**Reference**: See [TDD-BEHAVIOR-VS-IMPLEMENTATION.md](./TDD-BEHAVIOR-VS-IMPLEMENTATION.md)

---

### ❌ Anti-Pattern 2: Testing Private Methods

**Problem**:

```typescript
// ❌ DON'T: Test internal methods
expect(service['internalHelper']).toHaveBeenCalled();
```

**Solution**:

```typescript
// ✅ DO: Test public API behavior
expect(result).toBe(expectedValue);
```

---

### ❌ Anti-Pattern 3: Multiple Assertions for Same Behavior

**Problem**:

```typescript
// ❌ DON'T: Over-specify
expect(result.property1).toBe('value');
expect(result.property2).toBe('value');
// ... 10 more assertions
expect(prismaMock.method).toHaveBeenCalled(); // Also redundant
```

**Solution**:

```typescript
// ✅ DO: Test key properties
expect(result).toMatchObject({
  property1: 'value',
  property2: 'value',
});
```

---

### ❌ Anti-Pattern 4: Testing Framework Features

**Problem**:

```typescript
// ❌ DON'T: Test that Prisma works
expect(prismaMock.report.findUnique).toBeDefined();
```

**Solution**:

```typescript
// ✅ DO: Test YOUR code
expect(await repository.findById('id')).not.toBeNull();
```

---

**Quick Check**: If refactoring breaks your test but behavior is unchanged, you're testing implementation.

````

---

### 2. Add Quick Reference to Test Files

**Location**: `__tests__/utils/README.md` (create if doesn't exist)

**Content**:
```markdown
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
````

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

````

---

### 3. Update CLAUDE.md (Project Instructions)

**Location**: `/home/user/apex/CLAUDE.md`

**Add to "Testing" Section** (or create one):

```markdown
## Testing Guidelines

**Reference**: See [docs/TDD-GUIDE.md](./docs/TDD-GUIDE.md) and [docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md](./docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md)

### Key Principles

1. **Test Behavior, Not Implementation**
   - ✅ Test WHAT is returned
   - ❌ Don't test HOW it's done
   - See: docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md

2. **RED-GREEN-REFACTOR**
   - Write failing test first (RED)
   - Make it pass (GREEN)
   - Clean up code (REFACTOR)

3. **Coverage Goals**
   - Domain entities: 100%
   - Repositories: 100%
   - Services: 95%
   - Overall: 90%+

### Running Tests

```bash
npm test                  # Run all tests
npm test:watch           # Watch mode
npm test:coverage        # With coverage report
npm test Report.test.ts  # Single file
````

### Example Test (Behavior-Focused)

```typescript
it('should return active reports for user', async () => {
  const mockReports = [
    { id: 'r1', userId: 'user-123', deletedAt: null },
    { id: 'r2', userId: 'user-123', deletedAt: null },
  ];
  prismaMock.report.findMany.mockResolvedValue(mockReports);

  const result = await repository.findByUserId('user-123');

  // ✅ Test BEHAVIOR
  expect(result).toHaveLength(2);
  result.forEach((r) => {
    expect(r.userId).toBe('user-123');
    expect(r.deletedAt).toBeNull();
  });
});
```

**Anti-Pattern to Avoid**:

```typescript
// ❌ DON'T test implementation
expect(prismaMock.report.findMany).toHaveBeenCalledWith({
  /* ... */
});
```

````

---

### 4. Create Test Template

**Location**: `__tests__/TEMPLATE.test.ts`

**Content**:
```typescript
/**
 * [Feature Name] Tests
 *
 * Testing [what this tests].
 *
 * IMPORTANT: Focus on BEHAVIOR (what is returned),
 * not IMPLEMENTATION (how it's done).
 *
 * Reference: docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 */

import { FeatureUnderTest } from '@/path/to/feature';
import { mockDependency } from '@/__tests__/utils/mocks';

describe('FeatureUnderTest', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks
  });

  describe('methodName', () => {
    it('should [behavior description]', async () => {
      // Arrange: Set up test data
      const mockData = { /* ... */ };
      mockDependency.method.mockResolvedValue(mockData);

      // Act: Execute method
      const result = await featureUnderTest.methodName();

      // Assert: Verify BEHAVIOR (what was returned)
      expect(result).toHaveProperty('expectedProperty');
      expect(result.value).toBe('expectedValue');

      // ✅ GOOD: Testing returned data
      // ❌ BAD: expect(mockDependency.method).toHaveBeenCalledWith(...)
    });

    it('should handle error case', async () => {
      // Arrange: Set up error condition
      mockDependency.method.mockRejectedValue(new Error('Test error'));

      // Act & Assert: Verify error handling behavior
      await expect(featureUnderTest.methodName()).rejects.toThrow('Test error');
    });
  });
});
````

---

## Summary of Required Updates

| Document                     | Section         | Action                         | Priority |
| ---------------------------- | --------------- | ------------------------------ | -------- |
| `TDD-GUIDE.md`               | After TOC       | Add reference to new guide     | HIGH     |
| `TDD-GUIDE.md`               | Section 3.2     | Replace with behavior examples | HIGH     |
| `TDD-GUIDE.md`               | New Section 11  | Add anti-patterns              | MEDIUM   |
| `CLAUDE.md`                  | Testing section | Add testing guidelines         | HIGH     |
| `__tests__/utils/README.md`  | New file        | Create quick reference         | MEDIUM   |
| `__tests__/TEMPLATE.test.ts` | New file        | Create test template           | LOW      |

---

## How to Verify

After updates, ensure:

1. ✅ All documentation references behavior-first testing
2. ✅ No examples show `toHaveBeenCalledWith` with complex objects
3. ✅ Clear guidance on when to test implementation (integration tests only)
4. ✅ Links between documents work
5. ✅ Examples match actual codebase patterns

---

## Maintenance

When adding new test examples to documentation:

1. Ask: "Does this test WHAT or HOW?"
2. If testing HOW → Refactor to test WHAT
3. Add comment: `// Test BEHAVIOR: ...`
4. Reference: `docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md`

---

**Status**: Documentation framework complete. Manual updates to TDD-GUIDE.md still needed.
