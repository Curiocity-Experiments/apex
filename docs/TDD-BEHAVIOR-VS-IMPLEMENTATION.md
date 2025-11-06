# Behavior vs Implementation Testing

**Version**: 1.0
**Date**: 2025-11-06
**Context**: Critical guidance for writing maintainable tests
**Integration**: This document supplements docs/TDD-GUIDE.md

---

## Quick Reference

| Aspect         | Behavior Testing ✅                | Implementation Testing ❌                  |
| -------------- | ---------------------------------- | ------------------------------------------ |
| **Tests**      | WHAT is returned                   | HOW it's done                              |
| **Survives**   | Refactoring                        | Original implementation only               |
| **Focuses on** | Observable outcomes                | Internal mechanics                         |
| **Use for**    | Most tests (95%)                   | Integration tests only                     |
| **Example**    | `expect(result.name).toBe('Test')` | `expect(mock).toHaveBeenCalledWith({...})` |

---

## The Core Principle

### ❌ Don't Test Implementation

**Implementation testing** couples your tests to internal details:

```typescript
// ❌ BAD: Testing HOW Prisma is called
it('should find reports', async () => {
  await repository.findByUserId('user-123');

  expect(prismaMock.report.findMany).toHaveBeenCalledWith({
    where: { userId: 'user-123', deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
});
```

**Problem**: Test breaks when you optimize the query, even if behavior is identical:

```typescript
// This refactoring BREAKS the test above:
findMany({
  where: { userId, deletedAt: { equals: null } }, // Different but equivalent
});
```

### ✅ Test Behavior Instead

**Behavior testing** verifies observable outcomes:

```typescript
// ✅ GOOD: Testing WHAT is returned
it('should find reports for user', async () => {
  const mockReports = [
    { id: 'r1', userId: 'user-123', deletedAt: null /* ... */ },
    { id: 'r2', userId: 'user-123', deletedAt: null /* ... */ },
  ];
  prismaMock.report.findMany.mockResolvedValue(mockReports);

  const result = await repository.findByUserId('user-123');

  // Test BEHAVIOR: verify correct data returned
  expect(result).toHaveLength(2);
  expect(result[0].userId).toBe('user-123');
  expect(result[1].userId).toBe('user-123');

  // All results should be active (not deleted)
  result.forEach((report) => {
    expect(report.deletedAt).toBeNull();
  });
});
```

**Benefit**: This test passes regardless of how you query the database, as long as behavior is correct.

---

## Real-World Example: The Refactoring

### Scenario

You need to optimize Prisma queries for performance.

### Before (Implementation-Focused Tests)

**Test**:

```typescript
it('should exclude deleted reports', async () => {
  await repository.findByUserId('user-123');

  expect(prismaMock.report.findMany).toHaveBeenCalledWith({
    where: { deletedAt: null }, // ❌ Coupled to this exact structure
  });
});
```

**Optimization Attempt**:

```typescript
// Change query structure for performance
- where: { deletedAt: null }
+ where: { AND: [{ deletedAt: null }, { userId }] }
```

**Result**: ❌ **Test FAILS** even though behavior is unchanged!

### After (Behavior-Focused Tests)

**Test**:

```typescript
it('should exclude deleted reports', async () => {
  const activeReport = { id: 'r1', deletedAt: null /* ... */ };
  prismaMock.report.findMany.mockResolvedValue([activeReport]);

  const result = await repository.findByUserId('user-123');

  // Test BEHAVIOR: verify only active reports returned
  expect(result).toHaveLength(1);
  expect(result[0].deletedAt).toBeNull();
});
```

**Same Optimization**:

```typescript
// Change query structure for performance
- where: { deletedAt: null }
+ where: { AND: [{ deletedAt: null }, { userId }] }
```

**Result**: ✅ **Test PASSES** - behavior unchanged!

---

## When to Use Each Approach

### ✅ Use Behavior Testing (95% of tests)

**Applies to:**

- ✅ Domain entities
- ✅ Repository layer (with mocked database)
- ✅ Service layer (with mocked repositories)
- ✅ API routes (with mocked services)
- ✅ React components (with user interactions)

**Pattern:**

```typescript
// Arrange: Set up mocks to return data
mock.method.mockResolvedValue(expectedData);

// Act: Call the method
const result = await service.doSomething();

// Assert: Verify WHAT was returned
expect(result.property).toBe(expectedValue);
expect(result).toHaveLength(expectedCount);
expect(result).toMatchObject(expectedShape);
```

### ❌ Use Implementation Testing (5% - Integration tests only)

**Applies to:**

- Integration tests with real database
- E2E tests verifying full stack
- Performance benchmarks
- Database migration tests

**Pattern:**

```typescript
// Integration test with real DB
it('should query database correctly', async () => {
  // Use real database, not mocks
  const result = await repository.findByUserId('user-123');

  // Verify actual database state
  expect(result).toHaveLength(expectedCount);

  // Optional: Verify query was efficient
  const queryCount = await getQueryCount();
  expect(queryCount).toBeLessThan(5); // Performance check
});
```

---

## Practical Guidelines

### Repository Layer

#### ❌ Wrong Way (Implementation-Focused)

```typescript
describe('PrismaReportRepository', () => {
  it('should call Prisma with correct params', async () => {
    await repository.findByUserId('user-123');

    // ❌ Testing HOW Prisma is called
    expect(prismaMock.report.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });
});
```

**Problems:**

1. Breaks when optimizing query structure
2. Breaks when adding indexes
3. Breaks when changing sort order
4. Doesn't verify actual data correctness

#### ✅ Right Way (Behavior-Focused)

```typescript
describe('PrismaReportRepository', () => {
  it('should return active reports for user', async () => {
    const mockReports = [
      { id: 'r1', userId: 'user-123', name: 'Report 1', deletedAt: null },
      { id: 'r2', userId: 'user-123', name: 'Report 2', deletedAt: null },
    ];
    prismaMock.report.findMany.mockResolvedValue(mockReports);

    const result = await repository.findByUserId('user-123');

    // ✅ Test BEHAVIOR: verify returned data
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('r1');
    expect(result[1].id).toBe('r2');

    // ✅ Verify all reports belong to correct user
    result.forEach((report) => {
      expect(report.userId).toBe('user-123');
      expect(report.deletedAt).toBeNull();
    });
  });
});
```

**Benefits:**

1. ✅ Survives query optimization
2. ✅ Survives refactoring
3. ✅ Verifies actual correctness
4. ✅ Documents expected behavior

### Service Layer

#### ❌ Wrong Way

```typescript
it('should call repository with correct params', async () => {
  await service.createReport({ name: 'Test' });

  // ❌ Testing repository was called
  expect(mockRepo.save).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Test' }),
  );
});
```

#### ✅ Right Way

```typescript
it('should create report with generated ID', async () => {
  const savedReport = { id: 'new-id', name: 'Test' /* ... */ };
  mockRepo.save.mockResolvedValue(savedReport);

  const result = await service.createReport({ name: 'Test' });

  // ✅ Test BEHAVIOR: verify returned report
  expect(result.id).toBeDefined();
  expect(result.name).toBe('Test');
  expect(result.content).toBe(''); // Default value
});
```

---

## Minimal `toHaveBeenCalled` Usage

### When It's Acceptable

You can use `toHaveBeenCalled()` (without parameters) to verify a method was invoked:

```typescript
it('should soft delete report', async () => {
  await repository.delete('report-123');

  // ✅ OK: Basic verification that method was called
  expect(prismaMock.report.update).toHaveBeenCalled();
});
```

### When to Add Parameters

Only verify parameters when they're part of the **observable contract**:

```typescript
it('should pass file to storage service', async () => {
  const file = new File(['content'], 'test.pdf');
  await service.uploadDocument(file);

  // ✅ OK: File is the observable input
  expect(mockStorage.saveFile).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'test.pdf' }),
  );
});
```

### What to Avoid

Don't verify internal implementation details:

```typescript
// ❌ BAD: Testing internal query structure
expect(mock.query).toHaveBeenCalledWith({
  select: { id: true, name: true }, // Implementation detail
  where: { deletedAt: { equals: null } }, // Implementation detail
});

// ✅ GOOD: Test the result
expect(result).toHaveProperty('id');
expect(result).toHaveProperty('name');
expect(result.deletedAt).toBeNull();
```

---

## Migration Checklist

If you have existing implementation-focused tests, refactor them:

### Step 1: Identify Implementation Tests

Look for these patterns:

```typescript
// 🚩 Red flags:
expect(mock.method).toHaveBeenCalledWith({
  /* complex object */
});
expect(mock.query).toHaveBeenCalledWith({
  where: {
    /* ... */
  },
});
expect(mock.update).toHaveBeenCalledWith({
  data: {
    /* ... */
  },
});
```

### Step 2: Refactor to Behavior

For each test:

1. **Remove** complex `toHaveBeenCalledWith` assertions
2. **Set up** mock to return expected data
3. **Call** the method under test
4. **Assert** on the returned data
5. **Verify** behavior, not implementation

### Step 3: Add Comments

Mark refactored tests:

```typescript
// Test BEHAVIOR: verify correct data is returned
expect(result.name).toBe('Expected Name');
```

---

## Summary

### Key Principles

1. **Test WHAT, not HOW**
   - Focus on outputs, not internal mechanics

2. **Test Observable Behavior**
   - What the user/caller sees, not internal details

3. **Refactoring Should Be Safe**
   - Tests should pass if behavior unchanged

4. **Use Mocks for Isolation**
   - But verify return values, not how mocks were called

### Quick Decision Tree

```
Is this an integration test with real DB?
├─ YES → OK to test implementation
└─ NO  → Test behavior only

Am I testing:
├─ What is returned? → ✅ Behavior (good)
├─ What side effects occurred? → ✅ Behavior (good)
└─ How the method called dependencies? → ❌ Implementation (bad)
```

---

## References

- **Real Example**: See `__tests__/infrastructure/repositories/PrismaReportRepository.test.ts`
- **Before/After**: Git commit `94dd827` shows the refactoring
- **TDD Guide**: See main TDD-GUIDE.md for general patterns

---

## Examples in Codebase

### ✅ Good Examples (Behavior-Focused)

1. **Domain Entity Tests**
   - `__tests__/domain/entities/Report.test.ts`
   - Tests entity properties and helper functions

2. **Repository Interface Tests**
   - `__tests__/domain/repositories/ReportRepository.test.ts`
   - Tests contract with mock implementations

3. **Prisma Repository Tests** (After Refactor)
   - `__tests__/infrastructure/repositories/PrismaReportRepository.test.ts`
   - Tests returned data, not Prisma calls

### ❌ Avoid These Patterns

```typescript
// Don't copy these anti-patterns:

// ❌ Testing query structure
expect(mock).toHaveBeenCalledWith({
  where: { complex: { nested: { query: true } } },
});

// ❌ Testing internal method calls
expect(helper.internalMethod).toHaveBeenCalled();

// ❌ Testing implementation details
expect(service.cache.get).toHaveBeenCalledWith('key');
```

---

**Remember**: If your test breaks when you refactor but behavior is unchanged, you're testing implementation, not behavior.
