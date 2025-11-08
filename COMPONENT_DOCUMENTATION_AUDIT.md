# Component Documentation Accuracy Report
**Date Generated**: 2025-11-08  
**Analysis Scope**: Apex React/Next.js Application

---

## Executive Summary

The Apex project exhibits **significant discrepancies** between CLAUDE.md documentation and actual implementation. The documented architecture describes a legacy DynamoDB/AWS-based system, while the actual implementation uses **PostgreSQL with Prisma ORM and React Query**. Most documented components either don't exist or differ substantially from documented designs.

**Key Finding**: The CLAUDE.md file is **severely outdated** and incompatible with the current codebase.

---

## 1. ARCHITECTURAL MISMATCH

### Documentation Location
- File: `/home/user/apex/CLAUDE.md` (lines 44-90)

### Documented vs. Actual

| Aspect | Documented | Actual |
|--------|-----------|--------|
| **Database** | DynamoDB (AWS) | PostgreSQL with Prisma ORM |
| **Tables** | `Document`, `Resource`, `ResourceMeta` | `Report`, `Document`, `User`, `Session` |
| **File Storage** | S3 (`wdb-curiocity-bucket`) | File system (`./storage` path) |
| **Parsing Service** | LlamaCloud API | (Not yet implemented in current phase) |
| **API Architecture** | Custom DynamoDB API routes | RESTful endpoints with Prisma |
| **State Management** | Context providers (AppContext, SwitchContext) | React Query + NextAuth only |

### Accuracy Assessment
**Status**: NEEDS MAJOR UPDATE  
**Severity**: Critical

The entire data model has been redesigned. CLAUDE.md references `ResourceMeta` as a separate entity, but the actual implementation uses a unified `Document` model.

---

## 2. CONTEXT PROVIDERS

### Documentation References
- **Documented Providers** (CLAUDE.md lines 101-105):
  - `AuthProvider` - NextAuth SessionProvider
  - `CurrentResourceProvider` (AppContext) - Resource/meta state
  - `SwitchProvider` - UI state management

### Implementation Analysis

#### Documented: AppContext
**Status**: DOES NOT EXIST  
**Documentation Location**: CLAUDE.md:104  
**Details**: 
- Documented as managing "current resource/meta, file uploads, and S3 operations"
- No AppContext.tsx file found in `/context/` directory

#### Documented: SwitchContext  
**Status**: DOES NOT EXIST  
**Documentation Location**: CLAUDE.md:105  
**Details**:
- Documented for UI state (view switching)
- No SwitchContext.tsx file found

#### Actual: Providers Implementation
**Location**: `/home/user/apex/lib/providers.tsx`
**Implementation**:
```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

**Providers Used**:
- `SessionProvider` (NextAuth) ✓ Documented & Implemented
- `QueryClientProvider` (React Query) - NOT mentioned in CLAUDE.md

**Configuration** (lines 18-28):
```typescript
defaultOptions: {
  queries: {
    staleTime: 60 * 1000,        // 1 minute
    refetchOnWindowFocus: false,  // Not documented
  },
}
```

### Accuracy Assessment
**Status**: PARTIALLY ACCURATE  
**Severity**: High
- AuthProvider usage is correct
- Two major context providers (AppContext, SwitchContext) documented but don't exist
- React Query not mentioned in documentation

---

## 3. COMPONENT ANALYSIS

### 3.1 DocumentList Component

#### Documentation Reference
- **Location**: CLAUDE.md:80 mentions "DocumentComponents" folder
- **No detailed component-level documentation in CLAUDE.md**

#### Implementation Analysis
**File**: `/home/user/apex/components/documents/DocumentList.tsx`

**Props Interface**:
```typescript
interface DocumentListProps {
  reportId: string;
}
```

**Hook Usage**:
```typescript
const { documents, isLoading, deleteDocument } = useDocuments(reportId);
```

**Returned Properties** from `useDocuments`:
- `documents: Document[]` ✓
- `isLoading: boolean` ✓
- `deleteDocument: UseMutation<Document, Error>` ✓
- `uploadDocument: UseMutation` (available but not destructured in component)
- `updateDocument: UseMutation` (available but not destructured in component)

**Features Implemented**:
- Loading state with skeleton (`DocumentListSkeleton`)
- Empty state message
- Document list rendering with filename and notes
- Delete button with confirmation dialog
- Uses `ConfirmDialog` component

**Documentation Status**: LACKS DETAIL
- Props documented in code JSDoc: ✓
- Hook integration documented: Partial
- No documentation of behavior in CLAUDE.md

---

### 3.2 ReportEditor Component

#### Documentation Reference
- **Location**: CLAUDE.md:79 mentions "report-home/" page
- **No component-level documentation for ReportEditor**

#### Implementation Analysis
**File**: `/home/user/apex/components/reports/ReportEditor.tsx`

**Props Interface**:
```typescript
interface ReportEditorProps {
  reportId: string;
}
```

**Hook Usage**:
```typescript
const { report, isLoading, updateReport } = useReport(reportId);
const debouncedContent = useDebounce(content, 1000);
```

**Key Features**:
| Feature | Documented | Implemented | Status |
|---------|-----------|-------------|--------|
| Markdown editor | No | SimpleMDE (dynamic import) | Implemented |
| Auto-save | No | Yes (1s debounce) | Implemented |
| Save status display | No | Yes (Saving/Error/Saved) | Implemented |
| Loading skeleton | No | `ReportEditorSkeleton` | Implemented |

**Props Documentation**: ✓ Complete in code
**Behavior Documentation**: Missing from CLAUDE.md

**NOT Documented but Implemented**:
- SimpleMDE integration
- useDebounce hook for auto-save
- Save status feedback
- Dynamic editor loading (SSR disabled)

---

### 3.3 ErrorBoundary Component

#### Documentation Reference
- **Mentioned in CLAUDE.md Phase 7 discussion** (not detailed)

#### Implementation Analysis
**File**: `/home/user/apex/components/ErrorBoundary.tsx`

**Props Interface**:
```typescript
interface Props {
  children: ReactNode;
  fallback?: ReactNode;  // Optional custom fallback
}
```

**Features Implemented**:
- Class component (required for error boundaries)
- `getDerivedStateFromError` implementation
- `componentDidCatch` logging
- Default error UI with details disclosure
- "Try again" and "Reload page" buttons
- Custom fallback support

**Documentation Status**:
- Props: ✓ Clear in code
- Error handling: ✓ Implemented
- Documentation: Missing from CLAUDE.md

---

### 3.4 SessionHandler Component

#### Documentation Reference
- **Mentioned in CLAUDE.md Phase 7 discussion** (not detailed)

#### Implementation Analysis
**File**: `/home/user/apex/components/SessionHandler.tsx`

**Hook Usage**:
```typescript
const { data: session, status } = useSession();  // NextAuth
const router = useRouter();
```

**Features**:
| Feature | Implementation | Status |
|---------|----------------|--------|
| Session expiration check | 60-second interval | ✓ |
| Expiration warning | 5 minutes before expiry | ✓ |
| Dialog display | Yes, with actions | ✓ |
| Keyboard handling | Enter/Escape support | ✓ (in ConfirmDialog) |
| Auto-redirect on expired | Yes (`router.push('/login')`) | ✓ |

**Props**: None (uses hooks directly)
**Documentation Status**: Missing from CLAUDE.md details

---

### 3.5 ConfirmDialog Component

#### Documentation Reference
- **Not mentioned in CLAUDE.md**

#### Implementation Analysis
**File**: `/home/user/apex/components/ui/confirm-dialog.tsx`

**Props Interface**:
```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;           // Default: "Confirm"
  cancelText?: string;            // Default: "Cancel"
  variant?: 'default' | 'destructive';  // Default: "default"
}
```

**Features**:
- Keyboard support (Enter to confirm, Escape to cancel)
- Auto-focus on confirm button
- Variant support (destructive styling)
- Customizable button text
- Built on Radix Dialog primitives

**Documentation Status**: UNDOCUMENTED
- Component not mentioned in CLAUDE.md
- Props not documented
- Keyboard shortcuts not documented

---

### 3.6 Skeleton Components

#### Documentation Reference
- **Mentioned in CLAUDE.md Phase 7 as "Skeleton components"**

#### Implementation Analysis

**Base Skeleton** (`/home/user/apex/components/ui/skeleton.tsx`):
```typescript
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      {...props}
    />
  );
}
```

**Props**:
- Standard HTML div attributes
- Custom className support

**Composed Skeletons**:

1. **DocumentListSkeleton** (`/home/user/apex/components/documents/DocumentListSkeleton.tsx`)
   - Creates 3 placeholder document cards
   - Uses Skeleton component for title, filename, notes, delete button

2. **ReportEditorSkeleton** (`/home/user/apex/components/reports/ReportEditorSkeleton.tsx`)
   - Header with title and save status placeholders
   - Content area skeletons

3. **ReportListSkeleton** (`/home/user/apex/components/reports/ReportListSkeleton.tsx`)
   - Creates 3 placeholder report cards

**Documentation Status**: PARTIALLY DOCUMENTED
- Existence documented: ✓
- Props not detailed
- Composite skeleton design not explained

---

## 4. HOOKS ANALYSIS

### 4.1 useDocuments Hook

**File**: `/home/user/apex/hooks/useDocuments.ts`

**Documented Interface**:
```typescript
export function useDocuments(reportId: string) {
  return {
    documents: Document[],
    isLoading: boolean,
    uploadDocument: UseMutation,
    updateDocument: UseMutation,
    deleteDocument: UseMutation,
  };
}
```

**Return Types**:
| Property | Type | Documented | Accurate |
|----------|------|-----------|----------|
| `documents` | `Document[]` | No | ✓ |
| `isLoading` | `boolean` | No | ✓ |
| `uploadDocument` | Mutation | No | ✓ |
| `updateDocument` | Mutation | No | ✓ |
| `deleteDocument` | Mutation | No | ✓ |

**JSDoc**: Present but references "Phase 4: Custom Hooks" which isn't in CLAUDE.md

**Documentation Status**: MISSING FROM CLAUDE.md
- Hook not mentioned in CLAUDE.md
- Implementation complete and well-tested
- Props need documentation

---

### 4.2 useReport Hook

**File**: `/home/user/apex/hooks/useReport.ts`

**Documented Interface**:
```typescript
export function useReport(reportId: string) {
  return {
    report: Report | undefined,
    isLoading: boolean,
    updateReport: UseMutation,
  };
}
```

**Features**:
- Fetches single report
- Mutation for updates
- Cache invalidation for both single and list queries

**Documentation Status**: MISSING FROM CLAUDE.md

---

### 4.3 useReports Hook

**File**: `/home/user/apex/hooks/useReports.ts`

**Documented Interface**:
```typescript
export function useReports() {
  return {
    reports: Report[],
    isLoading: boolean,
    createReport: UseMutation,
    updateReport: UseMutation,
    deleteReport: UseMutation,
  };
}
```

**Documentation Status**: MISSING FROM CLAUDE.md

---

### 4.4 useDebounce Hook

**File**: `/home/user/apex/hooks/useDebounce.ts`

**Interface**:
```typescript
export function useDebounce<T>(value: T, delay: number = 1000): T
```

**Documentation Status**:
- JSDoc present and comprehensive: ✓
- Not mentioned in CLAUDE.md
- Implementation: ✓ Correct

---

## 5. TYPE DEFINITIONS / ENTITIES

### 5.1 Report Entity

**File**: `/home/user/apex/domain/entities/Report.ts`

**Interface**:
```typescript
export interface Report {
  id: string;              // UUID
  userId: string;          // Foreign key
  name: string;            // Display name
  content: string;         // Markdown content
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;  // Soft delete support
}
```

**Type Guards**:
- `isReportDeleted(report: Report): boolean`
- `isReportActive(report: Report): boolean`

**Documented in CLAUDE.md**: NO
**Actual vs Documented**:
- Documented concept: "Report contains folders with resources"
- Actual: "Report contains documents, has markdown content"
- **Major Difference**: Structure completely changed

---

### 5.2 Document Entity

**File**: `/home/user/apex/domain/entities/Document.ts`

**Interface**:
```typescript
export interface Document {
  id: string;                 // UUID
  reportId: string;           // Foreign key
  filename: string;
  fileHash: string;           // SHA-256 for deduplication
  storagePath: string;
  parsedContent: string | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;    // Soft delete
}
```

**Type Guards**:
- `isDocumentDeleted(document: Document): boolean`
- `isDocumentActive(document: Document): boolean`
- `hasBeenParsed(document: Document): boolean`

**Documented in CLAUDE.md**: PARTIALLY
- Documented as: "Actual file content stored as markdown"
- Issues:
  - No mention of `fileHash` (deduplication)
  - No mention of soft delete (`deletedAt`)
  - No mention of `notes` field
  - Storage model mismatch (S3 vs filesystem)

---

### 5.3 NextAuth Session Type

**File**: `/home/user/apex/types/next-auth.d.ts`

**Interface**:
```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}
```

**Documented in CLAUDE.md**: NO
**Notes**: Extends NextAuth to include user ID in session

---

## 6. UI COMPONENTS (shadcn/ui based)

### 6.1 Button Component

**File**: `/home/user/apex/components/ui/button.tsx`

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
                              VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

**Variants**:
- `variant`: default, destructive, outline, secondary, ghost, link
- `size`: default, sm, lg, icon

**Documented**: NO
**Status**: Standard shadcn/ui button ✓

---

### 6.2 Card Component

**File**: `/home/user/apex/components/ui/card.tsx`

**Exports**:
- `Card` (root)
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

**Documented**: NO (except folder mention in CLAUDE.md)
**Status**: Standard shadcn/ui card ✓

---

### 6.3 Dialog Component

**File**: `/home/user/apex/components/ui/dialog.tsx`

**Exports**:
- `Dialog` (root)
- `DialogTrigger`
- `DialogPortal`
- `DialogClose`
- `DialogOverlay`
- `DialogContent`
- `DialogHeader`
- `DialogFooter`
- `DialogTitle`
- `DialogDescription`

**Documented**: NO (except folder mention)
**Status**: Standard shadcn/ui dialog ✓

---

## 7. CUSTOM COMPONENTS NOT DOCUMENTED

### ReportList Component
**File**: `/home/user/apex/components/reports/ReportList.tsx`

**Props**: None (uses hooks directly)

**Features**:
- Fetches all reports via `useReports()`
- Create new report with inline form
- Grid display with `ReportCard` components
- Loading state with `ReportListSkeleton`
- Empty state message

**Documentation Status**: MISSING

---

### ReportCard Component
**File**: `/home/user/apex/components/reports/ReportCard.tsx`

**Props**:
```typescript
interface ReportCardProps {
  report: Report;
}
```

**Features**:
- Displays report name and last updated date
- Links to report detail page
- Hover effect with shadow

**Documentation Status**: MISSING

---

### DocumentUpload Component
**File**: `/home/user/apex/components/documents/DocumentUpload.tsx`

**Props**:
```typescript
interface DocumentUploadProps {
  reportId: string;
}
```

**Features**:
- File type validation (.txt, .md only)
- File size limit (10MB)
- Error handling and display
- Success message display
- Uses `useDocuments()` hook

**Documentation Status**: MISSING

---

## 8. REPOSITORY INTERFACES

### ReportRepository

**File**: `/home/user/apex/domain/repositories/ReportRepository.ts`

**Methods**:
```typescript
interface ReportRepository {
  findById(id: string): Promise<Report | null>;
  findByUserId(userId: string, includeDeleted?: boolean): Promise<Report[]>;
  save(report: Report): Promise<Report>;
  delete(id: string): Promise<void>;
  search(userId: string, query: string): Promise<Report[]>;
}
```

**Documented in CLAUDE.md**: NO
**Status**: Implements Clean Architecture pattern not mentioned in docs

---

### DocumentRepository

**File**: `/home/user/apex/domain/repositories/DocumentRepository.ts`

**Methods**:
```typescript
interface DocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByReportId(reportId: string, includeDeleted?: boolean): Promise<Document[]>;
  findByHash(reportId: string, fileHash: string): Promise<Document | null>;
  save(document: Document): Promise<Document>;
  delete(id: string): Promise<void>;
  search(reportId: string, query: string): Promise<Document[]>;
}
```

**Documented in CLAUDE.md**: NO
**Key Feature**: `findByHash` for deduplication - not documented

---

## 9. MISSING DOCUMENTATION

### Not Documented in CLAUDE.md but Implemented:
1. ✗ Domain entities and repositories (Clean Architecture pattern)
2. ✗ React Query integration
3. ✗ All custom hooks (useDocuments, useReport, useReports, useDebounce)
4. ✗ Component-level documentation for all components
5. ✗ SessionHandler component
6. ✗ ErrorBoundary component
7. ✗ ConfirmDialog component
8. ✗ PostgreSQL database schema
9. ✗ Prisma ORM usage
10. ✗ File hash deduplication
11. ✗ Soft delete pattern
12. ✗ Local file storage (instead of S3)

### Documented in CLAUDE.md but NOT Implemented:
1. ✗ AppContext provider
2. ✗ SwitchContext provider
3. ✗ DynamoDB integration
4. ✗ S3 file storage
5. ✗ LlamaCloud API parsing
6. ✗ `types/types.tsx` file
7. ✗ `context/` directory structure
8. ✗ API routes for DynamoDB operations
9. ✗ ResourceMeta entity
10. ✗ Resource entity

---

## 10. SUMMARY TABLE

| Item | Documented | Implemented | Accurate | Status |
|------|-----------|------------|----------|--------|
| **Context Providers** | AuthProvider, CurrentResource, Switch | SessionProvider, QueryClientProvider | 50% | NEEDS UPDATE |
| **DocumentList Props** | Not documented | `{ reportId: string }` | N/A | MISSING DOCS |
| **ReportEditor Props** | Not documented | `{ reportId: string }` | N/A | MISSING DOCS |
| **ErrorBoundary** | Mentioned in Phase 7 | Fully implemented | ✓ | MISSING DETAILS |
| **SessionHandler** | Mentioned in Phase 7 | Fully implemented | ✓ | MISSING DETAILS |
| **ConfirmDialog** | Not mentioned | Fully implemented | N/A | COMPLETELY MISSING |
| **Skeleton Components** | Mentioned | 3 types implemented | Partial | MISSING DETAILS |
| **Hooks (useDocuments)** | Not mentioned | Fully implemented | N/A | COMPLETELY MISSING |
| **Hooks (useReport)** | Not mentioned | Fully implemented | N/A | COMPLETELY MISSING |
| **Hooks (useReports)** | Not mentioned | Fully implemented | N/A | COMPLETELY MISSING |
| **Hooks (useDebounce)** | Not mentioned | Fully implemented | ✓ | MISSING FROM CLAUDE.md |
| **Type Definitions** | 4 entities mentioned | Many more entities | 25% | COMPLETELY OUTDATED |
| **Database** | DynamoDB | PostgreSQL + Prisma | 0% | COMPLETELY WRONG |
| **File Storage** | S3 | Filesystem | 0% | COMPLETELY WRONG |
| **API Architecture** | Custom DynamoDB routes | RESTful Prisma endpoints | 0% | COMPLETELY WRONG |

---

## 11. CRITICAL DISCREPANCIES

### 1. Database Technology (CRITICAL)
- **Documented**: AWS DynamoDB with three separate tables
- **Actual**: PostgreSQL with Prisma ORM
- **Impact**: All database operations documentation is invalid

### 2. State Management (CRITICAL)
- **Documented**: Custom Context providers (AppContext, SwitchContext)
- **Actual**: React Query + NextAuth SessionProvider
- **Impact**: All state management patterns documented are not used

### 3. Component Documentation (HIGH)
- **Documented**: No component-level documentation
- **Actual**: 7+ major components implemented
- **Impact**: Developers have no reference for component APIs

### 4. Hook Documentation (HIGH)
- **Documented**: No mention of custom hooks
- **Actual**: 4 custom hooks with full React Query integration
- **Impact**: Developers must reverse-engineer hook APIs

### 5. Type Definitions (MEDIUM)
- **Documented**: 4 types mentioned (Document, Resource, ResourceMeta, ResourceCompressed)
- **Actual**: Different data model with Report + Document
- **Impact**: Type references in CLAUDE.md are incorrect

---

## 12. RECOMMENDATIONS

### Priority 1 (Immediate - Blocking):
1. **Remove or completely rewrite CLAUDE.md** - Current version is misleading
2. **Create Component Reference Document** with all props, hooks, and behaviors
3. **Document all custom hooks** (useDocuments, useReport, useReports, useDebounce)
4. **Create Architecture Overview** explaining actual tech stack (Prisma, React Query, NextAuth)

### Priority 2 (High - Next Phase):
1. Document type definitions from domain/entities
2. Document repository interfaces
3. Create example usage patterns for each component
4. Document test setup and patterns

### Priority 3 (Medium - Next Sprint):
1. Add JSDoc comments to all components
2. Create Storybook or component catalog
3. Document configuration options for React Query, NextAuth

---

## Appendix A: Files Referenced

**Documentation Files**:
- `/home/user/apex/CLAUDE.md` - Outdated main documentation
- `/home/user/apex/docs/DEVELOPER-GUIDE.md` - Implementation guide (partially aligned)

**Component Files Analyzed**:
- `/home/user/apex/components/documents/DocumentList.tsx`
- `/home/user/apex/components/reports/ReportEditor.tsx`
- `/home/user/apex/components/reports/ReportList.tsx`
- `/home/user/apex/components/reports/ReportCard.tsx`
- `/home/user/apex/components/documents/DocumentUpload.tsx`
- `/home/user/apex/components/ErrorBoundary.tsx`
- `/home/user/apex/components/SessionHandler.tsx`
- `/home/user/apex/components/ui/confirm-dialog.tsx`
- `/home/user/apex/components/ui/skeleton.tsx`
- `/home/user/apex/components/ui/button.tsx`
- `/home/user/apex/components/ui/card.tsx`
- `/home/user/apex/components/ui/dialog.tsx`

**Hook Files Analyzed**:
- `/home/user/apex/hooks/useDocuments.ts`
- `/home/user/apex/hooks/useReport.ts`
- `/home/user/apex/hooks/useReports.ts`
- `/home/user/apex/hooks/useDebounce.ts`

**Type Definition Files**:
- `/home/user/apex/domain/entities/Report.ts`
- `/home/user/apex/domain/entities/Document.ts`
- `/home/user/apex/domain/repositories/ReportRepository.ts`
- `/home/user/apex/domain/repositories/DocumentRepository.ts`
- `/home/user/apex/types/next-auth.d.ts`
- `/home/user/apex/lib/providers.tsx`

**Test Files Analyzed**:
- `/home/user/apex/hooks/__tests__/useDocuments.test.tsx`
- `/home/user/apex/components/documents/__tests__/DocumentList.test.tsx`
- `/home/user/apex/components/reports/__tests__/ReportEditor.test.tsx`

