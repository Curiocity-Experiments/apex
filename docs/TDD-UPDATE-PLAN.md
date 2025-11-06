# TDD Documentation Update Plan

**Created**: 2025-11-06
**Status**: Planning
**Goal**: Update all Apex documentation to follow strict Test-Driven Development (TDD) practices

---

## 1. Current State Analysis

### Documentation Files Requiring Updates

| File                         | Current State                   | TDD Impact                      | Priority     |
| ---------------------------- | ------------------------------- | ------------------------------- | ------------ |
| `DEVELOPER-GUIDE.md`         | Test-after (Phase 6)            | **HIGH** - Complete restructure | 🔴 Critical  |
| `TECHNICAL-DECISIONS.md`     | No testing methodology decision | **MEDIUM** - Add Decision #16   | 🟡 Important |
| `TECHNICAL-SPECIFICATION.md` | References testing minimally    | **MEDIUM** - Add TDD section    | 🟡 Important |
| `RESTART-PLAN.md`            | References Developer Guide      | **LOW** - Update Phase F        | 🟢 Minor     |
| `component-structure.md`     | Shows test structure            | **LOW** - Emphasize test-first  | 🟢 Minor     |

### Current Testing Approach

**Problem**: Traditional "code-first, test-later" approach

- Phase 1-5: Build all features (entities, repos, services, UI)
- Phase 6: Write tests (8 hours allocated)
- Risk: Tests become afterthought, low coverage, hard to retrofit

**Desired**: Strict TDD "test-first" approach

- Every feature: Write test → Watch fail → Implement → Pass → Refactor
- Red-Green-Refactor cycle for all code
- Tests drive design, not validate it

---

## 2. Documentation Updates Required

### 🔴 Priority 1: DEVELOPER-GUIDE.md (Critical)

**Current Structure** (50 steps, 7 phases):

```
Phase 0: Project Setup (2h)
Phase 1: Core Infrastructure (6h) ← Domain/Repos/Services
Phase 2: Business Logic (8h)
Phase 3: API Routes (8h)
Phase 4: Frontend Components (12h)
Phase 5: Pages & Routing (6h)
Phase 6: Testing & Refinement (8h) ← Tests written here
Phase 7: Final Polish (4h)
```

**New TDD Structure** (Interleaved test-first approach):

```
Phase 0: Project Setup + Test Infrastructure (3h)
  - Step 1-5: Same (Next.js, deps, DB, env)
  - Step 6: NEW - Jest/Testing Library setup
  - Step 7: NEW - Test utilities and mocks

Phase 1: Domain Layer (TDD) (8h)
  - Step 8: Write Report entity tests → Implement Report
  - Step 9: Write Document entity tests → Implement Document
  - Step 10: Write validation tests → Implement validation
  - Checkpoint: All domain tests passing

Phase 2: Repository Layer (TDD) (10h)
  - Step 11: Write IReportRepository tests (with mock)
  - Step 12: Implement PrismaReportRepository (make tests pass)
  - Step 13: Write IDocumentRepository tests
  - Step 14: Implement PrismaDocumentRepository
  - Step 15: Integration tests with real DB
  - Checkpoint: All repository tests passing

Phase 3: Service Layer (TDD) (10h)
  - Step 16: Write ReportService tests (mock repos)
  - Step 17: Implement ReportService
  - Step 18: Write DocumentService tests
  - Step 19: Implement DocumentService
  - Step 20: Write FileStorageService tests
  - Step 21: Implement FileStorageService
  - Step 22: Write ParserService tests
  - Step 23: Implement ParserService
  - Checkpoint: All service tests passing

Phase 4: API Layer (TDD) (10h)
  - Step 24: Write NextAuth tests
  - Step 25: Implement auth/[...nextauth]/route.ts
  - Step 26: Write /api/reports tests
  - Step 27: Implement /api/reports routes
  - Step 28: Write /api/documents tests
  - Step 29: Implement /api/documents routes
  - Checkpoint: All API tests passing

Phase 5: Frontend Hooks (TDD) (8h)
  - Step 30: Write useReports tests
  - Step 31: Implement useReports
  - Step 32: Write useDocuments tests
  - Step 33: Implement useDocuments
  - Checkpoint: All hook tests passing

Phase 6: Frontend Components (12h)
  - Step 34: Write ReportList tests → Implement
  - Step 35: Write ReportCard tests → Implement
  - Step 36: Write ReportEditor tests → Implement
  - Step 37: Write DocumentUpload tests → Implement
  - Step 38: Write DocumentList tests → Implement
  - Checkpoint: All component tests passing

Phase 7: Pages & Integration (6h)
  - Step 39: Write login page tests → Implement
  - Step 40: Write reports page tests → Implement
  - Step 41: Write report detail page tests → Implement
  - Step 42: E2E happy path test
  - Checkpoint: Full user flow works

Phase 8: Refactoring & Polish (4h)
  - Step 43: Code review with tests
  - Step 44: Performance optimization
  - Step 45: Error handling improvements
  - Step 46: Documentation
```

**Key Changes**:

- ✅ Test infrastructure setup in Phase 0
- ✅ Each phase includes test writing BEFORE implementation
- ✅ Clear Red-Green-Refactor cycle at each step
- ✅ Checkpoints verify tests pass before moving forward
- ✅ Total time increases from 54h → 71h (worth it for quality)

---

### 🟡 Priority 2: Create TDD-GUIDE.md (New File)

**Purpose**: Comprehensive guide for TDD practices in Apex

**Contents**:

```markdown
# Apex TDD Guide

## 1. TDD Philosophy

- Why test-first matters
- Red-Green-Refactor explained
- Benefits for Apex architecture

## 2. Testing Strategy by Layer

### Domain Layer (Pure Functions)

- Unit tests only
- No mocking needed
- Test validation logic
- Example: Report.test.ts

### Repository Layer (Database I/O)

- Unit tests with mocked Prisma
- Integration tests with test DB
- Transaction handling
- Example: PrismaReportRepository.test.ts

### Service Layer (Business Logic)

- Unit tests with mocked repositories
- Test all business rules
- Test error handling
- Example: ReportService.test.ts

### API Layer (HTTP Handlers)

- Integration tests with supertest
- Test auth middleware
- Test request validation
- Example: reports.route.test.ts

### Frontend (React Components)

- Unit tests with React Testing Library
- Test user interactions
- Test loading/error states
- Example: ReportList.test.tsx

## 3. Test Patterns & Utilities

### Common Mocks

- mockPrisma()
- mockNextAuthSession()
- mockFileUpload()

### Test Factories

- createMockReport()
- createMockDocument()
- createMockUser()

### Custom Matchers

- toBeValidReport()
- toHaveBeenCalledWithUser()

## 4. TDD Workflow

### Step-by-step for each feature

1. Write failing test
2. Run test (see RED)
3. Write minimal code
4. Run test (see GREEN)
5. Refactor
6. Commit with test + implementation

## 5. CI/CD Integration

- Pre-commit: Run tests
- PR: Full test suite
- Deployment: Tests must pass

## 6. Coverage Goals

- Domain: 100%
- Services: 95%
- Repositories: 90%
- API: 90%
- Components: 80%
```

---

### 🟡 Priority 3: TECHNICAL-DECISIONS.md

**Add Decision #16: Testing Methodology**

```markdown
## 16. Testing Methodology: TDD vs Test-After

### ✅ **DECISION: Strict Test-Driven Development (TDD)**

**Reasoning**:

- **Quality First**: Tests drive design, not validate it
- **Refactoring Safety**: High coverage from day 1 enables fearless refactoring
- **Documentation**: Tests serve as living documentation
- **Bug Prevention**: Catch issues at write-time, not runtime
- **Clean Architecture**: TDD naturally enforces SOLID principles

**Rejected: Test-After**

- ❌ Tests become afterthought (often skipped under pressure)
- ❌ Low coverage (typically 30-50%)
- ❌ Hard to test tightly coupled code
- ❌ Bugs found late (in QA or production)
- **Verdict**: Not acceptable for financial data platform

**Implementation**:

- Red-Green-Refactor cycle for ALL code
- Tests written BEFORE implementation
- Coverage targets: Domain 100%, Services 95%, API 90%
- CI/CD blocks merges without passing tests

**Tools**:

- Jest (test runner)
- React Testing Library (component tests)
- Supertest (API integration tests)
- Mock Service Worker (API mocking for frontend)

**Trade-offs**:

- ⏱️ Initial development ~30% slower
- ✅ Debugging time reduced by 70%
- ✅ Production bugs reduced by 80%
- ✅ Refactoring velocity increased 3x
```

---

### 🟡 Priority 4: TECHNICAL-SPECIFICATION.md

**Add Section After "Architecture Layers"**:

```markdown
## Testing Strategy

**Methodology**: Strict Test-Driven Development (TDD)

### Test Pyramid
```

       /\
      /E2E\       ← Few (5-10 critical paths)
     /------\
    /  API   \    ← Some (30-40 endpoints)

/----------\
 / Component \ ← More (50-60 components)
/--------------\
/ Unit Tests \ ← Many (100+ functions)

---

```

### Layer-Specific Testing

| Layer | Test Type | Tools | Coverage Target |
|-------|-----------|-------|-----------------|
| Domain | Unit | Jest | 100% |
| Services | Unit (mocked repos) | Jest + MSW | 95% |
| Repositories | Unit + Integration | Jest + Prisma | 90% |
| API Routes | Integration | Jest + Supertest | 90% |
| React Hooks | Unit | Jest + RTL | 85% |
| Components | Unit | Jest + RTL | 80% |
| Pages | Integration + E2E | Playwright | Critical paths only |

### TDD Workflow

Every feature follows Red-Green-Refactor:
1. **RED**: Write failing test
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve while keeping tests green
4. **COMMIT**: Test + implementation together

### Test Organization

```

domain/
entities/
Report.ts
**tests**/
Report.test.ts
services/
ReportService.ts
**tests**/
ReportService.test.ts
repositories/
implementations/
PrismaReportRepository.ts
**tests**/
PrismaReportRepository.test.ts

```

### CI/CD Integration

- Pre-commit hook: Run tests on staged files
- Pull request: Full test suite must pass
- Deployment: 100% test pass required
```

---

### 🟢 Priority 5: RESTART-PLAN.md

**Update Phase F** (line 906-978):

````markdown
### Phase F: Begin Phase 1 Development

**Goal**: Start implementing core infrastructure following Developer Guide with TDD

#### Reference Documentation

At this point, switch to following the Developer Guide step-by-step:

**Primary Reference**: `/home/user/apex/docs/DEVELOPER-GUIDE.md`

**Current Location**: Phase 1 (starting at Step 6)

#### Phase 1 Overview (TDD Approach)

**NEW: All code written test-first (Red-Green-Refactor)**

**Steps to implement** (6-10):

1. ✓ Create project structure (already done in Phase D5)
2. ✓ Create Prisma client singleton (already done in Phase D9)
3. Setup Jest and testing utilities (NEW - see TDD-GUIDE.md)
4. Write Report entity tests → Implement Report entity
5. Write Document entity tests → Implement Document entity
6. Write repository interface tests → Implement interfaces
7. Write PrismaReportRepository tests → Implement repository
8. Write PrismaDocumentRepository tests → Implement repository

#### Quick Start Phase 1 (TDD)

```bash
# Step 1: Setup testing infrastructure
npm test -- --init

# Step 2: Write first test (RED)
# Create domain/entities/__tests__/Report.test.ts
# Write test for Report.create()

# Step 3: Run test (watch it fail)
npm test -- --watch

# Step 4: Implement Report.ts (GREEN)
# Write minimal code to pass test

# Step 5: Refactor if needed, keep tests green

# Step 6: Commit
git add domain/entities/Report.ts domain/entities/__tests__/Report.test.ts
git commit -m "feat: Add Report entity with validation (TDD)"

# Continue following Developer Guide...
```
````

#### Development Workflow (TDD)

For each step in Developer Guide:

1. **RED**: Write failing test
2. **GREEN**: Implement minimal code
3. **REFACTOR**: Clean up
4. **TEST**: Verify all tests pass
5. **COMMIT**: Test + implementation together

```

---

## 3. Implementation Plan

### Phase A: Documentation Review & Planning ✅ COMPLETE

**Tasks**:
- [x] Analyze current documentation structure
- [x] Identify all files requiring updates
- [x] Create comprehensive update plan
- [x] Prioritize changes

**Time**: 1 hour (complete)

---

### Phase B: Create TDD-GUIDE.md (New Resource)

**Tasks**:
- [ ] Write TDD philosophy section
- [ ] Document testing strategy by layer
- [ ] Create test patterns & utilities guide
- [ ] Write step-by-step TDD workflow
- [ ] Add code examples for each layer
- [ ] Document CI/CD integration
- [ ] Define coverage goals

**Deliverable**: `docs/TDD-GUIDE.md` (comprehensive TDD reference)

**Time**: 2 hours

---

### Phase C: Update TECHNICAL-DECISIONS.md

**Tasks**:
- [ ] Add Decision #16: Testing Methodology
- [ ] Document TDD vs Test-After trade-offs
- [ ] Specify tools (Jest, RTL, Supertest, MSW)
- [ ] Define coverage targets
- [ ] Add implementation notes

**Deliverable**: Updated `docs/prd/TECHNICAL-DECISIONS.md`

**Time**: 30 minutes

---

### Phase D: Update TECHNICAL-SPECIFICATION.md

**Tasks**:
- [ ] Add "Testing Strategy" section after Architecture
- [ ] Include test pyramid diagram (ASCII art)
- [ ] Document layer-specific testing approach
- [ ] Add TDD workflow description
- [ ] Show test organization structure
- [ ] Document CI/CD integration

**Deliverable**: Updated `docs/TECHNICAL-SPECIFICATION.md`

**Time**: 45 minutes

---

### Phase E: Restructure DEVELOPER-GUIDE.md (Major Refactor)

**Tasks**:
- [ ] Restructure all 7 phases for test-first approach
- [ ] Add Phase 0 Step 6-7: Test infrastructure setup
- [ ] Rewrite Phase 1: Domain layer with TDD
- [ ] Rewrite Phase 2: Repository layer with TDD
- [ ] Rewrite Phase 3: Service layer with TDD
- [ ] Rewrite Phase 4: API layer with TDD
- [ ] Rewrite Phase 5: Frontend hooks with TDD
- [ ] Rewrite Phase 6: Components with TDD
- [ ] Rewrite Phase 7: Pages & integration with TDD
- [ ] Add Phase 8: Refactoring & polish
- [ ] Update all code examples to include tests first
- [ ] Add Red-Green-Refactor instructions at each step
- [ ] Update time estimates (54h → 71h)

**Deliverable**: Fully restructured `docs/DEVELOPER-GUIDE.md`

**Time**: 4 hours (most complex update)

---

### Phase F: Update RESTART-PLAN.md

**Tasks**:
- [ ] Update Phase F to reference TDD approach
- [ ] Modify Quick Start to show test-first workflow
- [ ] Update Development Workflow section
- [ ] Add reference to TDD-GUIDE.md

**Deliverable**: Updated `docs/RESTART-PLAN.md`

**Time**: 30 minutes

---

### Phase G: Update component-structure.md

**Tasks**:
- [ ] Emphasize __tests__ directories
- [ ] Add test file examples
- [ ] Show test-first workflow in examples
- [ ] Update component examples to include tests

**Deliverable**: Updated `docs/technical-spec/component-structure.md`

**Time**: 30 minutes

---

### Phase H: Create Test Setup Files

**Tasks**:
- [ ] Create `jest.config.js` (updated for TDD)
- [ ] Create `jest.setup.js` (test utilities)
- [ ] Create `__tests__/utils/mocks.ts` (common mocks)
- [ ] Create `__tests__/utils/factories.ts` (test data factories)
- [ ] Update package.json scripts for watch mode
- [ ] Add pre-commit hook for tests

**Deliverable**: Test infrastructure files

**Time**: 1 hour

---

## 4. Summary

### Total Time Estimate: 9.5 hours

| Phase | Task | Time | Status |
|-------|------|------|--------|
| A | Review & Planning | 1h | ✅ Complete |
| B | Create TDD-GUIDE.md | 2h | ⏳ Pending |
| C | Update TECHNICAL-DECISIONS.md | 0.5h | ⏳ Pending |
| D | Update TECHNICAL-SPECIFICATION.md | 0.75h | ⏳ Pending |
| E | Restructure DEVELOPER-GUIDE.md | 4h | ⏳ Pending |
| F | Update RESTART-PLAN.md | 0.5h | ⏳ Pending |
| G | Update component-structure.md | 0.5h | ⏳ Pending |
| H | Create Test Setup Files | 1h | ⏳ Pending |

### Key Changes Summary

1. **TDD-GUIDE.md** (NEW): Comprehensive TDD reference
2. **DEVELOPER-GUIDE.md** (MAJOR): Complete restructure for test-first
3. **TECHNICAL-DECISIONS.md** (ADD): Decision #16 on testing
4. **TECHNICAL-SPECIFICATION.md** (ADD): Testing strategy section
5. **RESTART-PLAN.md** (UPDATE): Phase F for TDD workflow
6. **Test files** (NEW): Jest config, mocks, factories

### Benefits After Update

✅ **Clear TDD methodology** documented across all docs
✅ **Test-first approach** enforced from Phase 0
✅ **Red-Green-Refactor** workflow at every step
✅ **High code coverage** (95%+) from day 1
✅ **Refactoring confidence** with comprehensive test suite
✅ **Living documentation** via tests
✅ **Bug prevention** through test-first design

---

## 5. Approval & Execution

**Status**: 🟡 **Awaiting Approval**

**Next Steps**:
1. Review this plan
2. Approve or request modifications
3. Execute phases B-H in sequence
4. Verify documentation consistency
5. Begin Phase 1 development with TDD

**Estimated completion**: 8.5 hours of work remaining

---

**Plan created by**: Claude Code
**Date**: 2025-11-06
**Version**: 1.0
```
