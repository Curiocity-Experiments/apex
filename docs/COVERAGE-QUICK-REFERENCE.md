# Apex Test Coverage - Quick Reference Guide

## 🎯 Current Status at a Glance

| Metric                | Current | Target | Gap          | Severity |
| --------------------- | ------- | ------ | ------------ | -------- |
| **Code Coverage**     | 57.18%  | 90%    | ❌ -32.82%   | Critical |
| **Behavior Coverage** | ~35%    | 85%    | ❌ -50%      | Critical |
| **Tests Passing**     | 228/230 | All    | ⚠️ 2 failing | Moderate |
| **Test Files**        | 20      | -      | ✅ Adequate  | Good     |

---

## 🔴 Critical Gaps (Must Fix Before Launch)

### 1. User Authentication Flow

- **File**: `/app/(auth)/login/page.tsx`
- **Coverage**: 0% ❌
- **Impact**: Users can't log in
- **Fix Time**: 4 hours
- **Tests Needed**: 8-10 tests

### 2. Document Upload Component

- **File**: `/components/documents/DocumentUpload.tsx`
- **Coverage**: 0% ❌
- **Impact**: Users can't upload files
- **Fix Time**: 5 hours
- **Tests Needed**: 12-15 tests

### 3. Error Boundary (Production Safety)

- **File**: `/components/ErrorBoundary.tsx`
- **Coverage**: 0% ❌
- **Impact**: Errors crash app instead of showing graceful fallback
- **Fix Time**: 3 hours
- **Tests Needed**: 6-8 tests

### 4. Session Management

- **File**: `/components/SessionHandler.tsx`
- **Coverage**: 0% ❌
- **Impact**: Session loss not handled, users see broken app
- **Fix Time**: 4 hours
- **Tests Needed**: 10-12 tests

### 5. useReport Hook (Report Editing)

- **File**: `/hooks/useReport.ts`
- **Coverage**: 12.5% ❌
- **Impact**: Report editing may fail silently
- **Fix Time**: 3 hours
- **Tests Needed**: 10-12 tests

---

## 🟡 High Priority (Fix Next Week)

### Service Layer Error Handling

| Service            | Coverage     | Gap     | Priority |
| ------------------ | ------------ | ------- | -------- |
| FileStorageService | 72.72%       | -22.28% | High     |
| ParserService      | 80%          | -15%    | High     |
| DocumentService    | 90%          | -5%     | Medium   |
| useDocuments Hook  | 40% branches | -55%    | High     |

---

## ✅ Well-Tested Areas

| Layer                   | Status      | Coverage |
| ----------------------- | ----------- | -------- |
| Domain Entities         | ✅ Perfect  | 100%     |
| Repositories            | ✅ Perfect  | 100%     |
| ReportService           | ✅ Perfect  | 100%     |
| Report API Routes       | ✅ Complete | ~95%     |
| UI Components (Reports) | ✅ Good     | 100%     |

---

## 📊 Coverage by Layer Summary

```
┌─────────────────────────────────────────────────────────┐
│ DOMAIN LAYER (Entities/Types)                           │
│ ████████████████████████████████████████ 100%    ✅    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE (Repositories)                           │
│ ████████████████████████████████████████ 100%    ✅    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ APPLICATION (Services)                                  │
│ ███████████████████████░░░░░░░░░░░░░░░░░ 88%     ⚠️    │
│ (DocumentService & FileStorageService below target)    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ API LAYER (Routes)                                      │
│ █████████████████████████░░░░░░░░░░░░░░░ 80%     ⚠️    │
│ (Document routes failing due to Prisma setup)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ HOOKS (Data Fetching)                                   │
│ █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░ 76%     ⚠️    │
│ (useReport 12%, useDocuments branches 40%)              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMPONENTS (UI)                                         │
│ ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40%     ❌    │
│ (Critical components: DocumentUpload, ErrorBoundary)    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PAGES & INTEGRATIONS                                    │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%      ❌    │
│ (LoginPage, layout, E2E flows completely untested)     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ GLOBAL COVERAGE (ALL LAYERS)                            │
│ ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 57%     ❌    │
│ Need: 90% | Gap: -32.82%                                │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Critical User Workflows Status

### Tier 1: Core Workflows

| Workflow        | Coverage | Risk     | Status                            |
| --------------- | -------- | -------- | --------------------------------- |
| Create Report   | 60%      | Moderate | ⚠️ Service tested, UI untested    |
| Edit Report     | 50%      | Moderate | ⚠️ Service tested, component gaps |
| Login           | 0%       | Critical | ❌ Untested                       |
| Upload Document | 20%      | Critical | ❌ UI untested                    |

### Tier 2: Functional Workflows

| Workflow        | Coverage | Risk     | Status                       |
| --------------- | -------- | -------- | ---------------------------- |
| Delete Report   | 50%      | Moderate | ⚠️ API tested, UI untested   |
| View Report     | 70%      | Low      | ✅ Mostly tested             |
| Search Reports  | 40%      | Low      | ⚠️ Logic tested, UI untested |
| Delete Document | 0%       | High     | ❌ Untested                  |

### Tier 3: System Workflows

| Workflow           | Coverage | Risk     | Status         |
| ------------------ | -------- | -------- | -------------- |
| Error Handling     | 0%       | Critical | ❌ Untested    |
| Session Management | 0%       | Critical | ❌ Untested    |
| Authorization      | 80%      | Low      | ✅ Well tested |
| Authentication     | 0%       | Critical | ❌ Untested    |

---

## 🎬 What To Do First (Action Items)

### Week 1: Critical (Blocking Production)

```
[ ] 1. Create LoginPage tests (4 hours)
    └─ /app/(auth)/__tests__/login.test.tsx

[ ] 2. Create DocumentUpload tests (5 hours)
    └─ /components/documents/__tests__/DocumentUpload.test.tsx

[ ] 3. Create ErrorBoundary tests (3 hours)
    └─ /components/__tests__/ErrorBoundary.test.tsx

[ ] 4. Create SessionHandler tests (4 hours)
    └─ /components/__tests__/SessionHandler.test.tsx

[ ] 5. Fix useReport hook tests (3 hours)
    └─ /hooks/__tests__/useReport.test.tsx

[ ] 6. Fix Document API tests (2 hours)
    └─ Fix Prisma initialization in /app/api/documents/route.test.ts

Total: ~21 hours
Impact: +30% coverage, fixes all critical workflows
```

### Week 2: High Priority (Important Features)

```
[ ] 7. Add FileStorageService error tests (4 hours)
[ ] 8. Fix useDocuments hook branch coverage (3 hours)
[ ] 9. Add ParserService edge cases (3 hours)
[ ] 10. Add ReportEditor interaction tests (3 hours)

Total: ~13 hours
Impact: +15% coverage, improves reliability
```

### Week 3: Medium Priority (Polish)

```
[ ] 11. Add auth.ts tests (6 hours)
[ ] 12. Add DocumentList tests (3 hours)
[ ] 13. Add navigation tests (2 hours)
[ ] 14. Improve branch coverage overall (4 hours)

Total: ~15 hours
Impact: +15% coverage, improves maintainability
```

---

## 📁 Files Needing Tests

### ❌ Critical (0% coverage)

1. `/app/(auth)/login/page.tsx` - Login form
2. `/components/documents/DocumentUpload.tsx` - Upload handler
3. `/components/ErrorBoundary.tsx` - Error handling
4. `/components/SessionHandler.tsx` - Session management
5. `/lib/auth.ts` - Auth configuration
6. `/lib/db.ts` - Database setup
7. `/lib/providers.tsx` - Context providers

### ⚠️ High Priority (< 50%)

1. `/hooks/useReport.ts` - Report editing (12.5%)
2. `/services/FileStorageService.ts` - Storage (72.72%)
3. `/services/ParserService.ts` - Parsing (80%)
4. `/hooks/useDocuments.ts` - Document hooks (40% branches)

### 🟡 Medium Priority (50-85%)

1. `/services/DocumentService.ts` - 55.55% branches
2. `/components/reports/ReportEditor.tsx` - 85.71% branches
3. `/hooks/useDebounce.ts` - 0% branches
4. `/components/ui/confirm-dialog.tsx` - 28.57% branches

---

## ⚡ Quick Fixes (< 30 minutes each)

1. **Fix Prisma Initialization in Document Tests**
   - Add proper mock setup in `/app/api/documents/route.test.ts`
   - Copy pattern from `/app/api/reports/route.test.ts`

2. **Add useReport.ts Basic Tests**
   - Simple query and mutation tests
   - Mirror pattern from useReports.test.tsx

3. **Add ErrorBoundary Error Catching**
   - Test throwing child component
   - Verify error display
   - Test recovery buttons

---

## 🎯 Success Criteria

When you've completed the critical fixes:

- [ ] All 10 critical workflows have at least 60% coverage
- [ ] No user-facing component at 0% coverage
- [ ] Authentication flow testable end-to-end
- [ ] Error handling verified
- [ ] All API routes testable (Prisma working)
- [ ] Overall coverage: 75%+ (from 57%)
- [ ] Behavior coverage: 60%+ (from 35%)

---

## 📞 Questions?

See the full detailed report: `/docs/COVERAGE-VS-BEHAVIOR-ASSESSMENT.md`

Key sections:

- Section 2: Detailed behavior coverage per workflow
- Section 5: Layer-by-layer analysis
- Section 6: Detailed recommendations with time estimates
