# Behavior vs Implementation Testing

**Quick Reference**: Test WHAT (behavior), not HOW (implementation)

---

## At a Glance

| Aspect         | Behavior Testing ✅                | Implementation Testing ❌                  |
| -------------- | ---------------------------------- | ------------------------------------------ |
| **Tests**      | WHAT is returned                   | HOW it's done                              |
| **Survives**   | Refactoring                        | Original implementation only               |
| **Focuses on** | Observable outcomes                | Internal mechanics                         |
| **Use for**    | 95% of tests                       | 5% (integration tests only)                |
| **Example**    | `expect(result.name).toBe('Test')` | `expect(mock).toHaveBeenCalledWith({...})` |

---

## The Rule

### ❌ Don't Do This

```typescript
// ❌ BAD: Testing HOW Prisma is called
expect(prismaMock.report.findMany).toHaveBeenCalledWith({
  where: { userId: 'user-123', deletedAt: null },
});
```

**Problem**: Breaks when you refactor the query, even if behavior is unchanged.

### ✅ Do This Instead

```typescript
// ✅ GOOD: Testing WHAT is returned
const result = await repository.findByUserId('user-123');

expect(result).toHaveLength(2);
expect(result[0].userId).toBe('user-123');
expect(result[0].deletedAt).toBeNull();
```

**Benefit**: Survives refactoring. Only breaks when actual behavior changes.

---

## When to Use Each

### ✅ Behavior Testing (95% of tests)

**Use for:**

- Domain entities
- Repositories (with mocked Prisma)
- Services (with mocked repositories)
- API routes (with mocked services)
- React components

**Pattern:**

```typescript
mock.method.mockResolvedValue(expectedData);
const result = await service.doSomething();
expect(result.property).toBe(expectedValue);
```

### ❌ Implementation Testing (5% of tests)

**Use ONLY for:**

- Integration tests with real database
- E2E tests
- Performance benchmarks

---

## Quick Check

**If refactoring breaks your test but behavior is unchanged, you're testing implementation.**

---

## Summary

- ✅ **DO**: Test outputs (what comes back)
- ❌ **DON'T**: Test internals (how it's called)
- 📖 **Why**: Implementation tests break on refactoring
- 🎯 **Goal**: 95% behavior, 5% implementation

For detailed examples, see [TDD-GUIDE.md](./TDD-GUIDE.md).
