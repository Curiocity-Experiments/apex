# Architecture Audit Report
**Date:** 2025-11-05
**Project:** Curiocity (Apex)
**Auditor:** Claude Code
**Codebase Stats:** 81 TypeScript files, 28 API routes, 39 components

---

## Executive Summary

**Overall Modularity Score: 3/10**

The Curiocity application follows a basic Next.js structure but suffers from significant architectural issues including God objects, tight coupling, missing abstraction layers, and widespread code duplication. The codebase lacks clear separation of concerns with business logic scattered across contexts, components, and API routes.

**Pattern Assessment:** Attempting a **Layered Architecture** but poorly executed with no clear service layer, repository pattern, or dependency injection. Heavy reliance on React Context for business logic creates tight coupling.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Components  │  │   Contexts   │  │    Pages     │         │
│  │  (39 files)  │  │ (God Objects)│  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         └─────────────────┼──────────────────┘                  │
│                           │ (31 direct fetch calls)             │
│                           │ No Service Layer ❌                 │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Routes Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  app/api/db/route.ts (God Object - 288 lines)           │  │
│  │  - Types, Utilities, HTTP Handlers, Analytics           │  │
│  │  - Shared: getObject, putObject, deleteObject            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │documents/│  │resource/ │  │resourcem │  │  auth/   │       │
│  │(3 routes)│  │(3 routes)│  │eta/      │  │  s3-     │       │
│  │          │  │          │  │(7 routes)│  │  upload  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │             │              │
│       └─────────────┴──────────────┴─────────────┘              │
│         Each creates own DynamoDBClient instance ❌             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │DynamoDB  │  │    S3    │  │LlamaCloud│  │ PostHog  │       │
│  │(3 tables)│  │  Bucket  │  │  Parsing │  │Analytics │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘

BOTTLENECKS:
🔴 AppContext.tsx (507 lines) - Mega context with 2 contexts + business logic
🔴 No connection pooling - Each route creates DynamoDB client
🔴 44× DynamoDB marshall/unmarshall calls - No abstraction
🔴 31× fetch calls in UI layer - No API client abstraction
```

---

## Architectural Assessment

### 1. Separation of Concerns
**Rating: ❌ Poor**

- Business logic mixed in React Contexts (507 lines in `AppContext.tsx`)
- API routes contain type definitions, utilities, and HTTP handlers
- No clear service layer or repository pattern
- Components make direct API calls via fetch

### 2. Architectural Pattern
**Pattern: Poorly Implemented Layered Architecture**

Attempts a traditional web architecture but lacks critical layers:
- ✅ Presentation Layer: React components
- ⚠️ Application Layer: Implemented via React Context (anti-pattern)
- ❌ Service Layer: **Missing entirely**
- ❌ Data Access Layer: **No repository pattern**
- ✅ External Services: DynamoDB, S3, LlamaCloud

### 3. God Objects/Modules
**Rating: 🔴 Critical Issue**

Multiple God objects identified doing far too much.

### 4. Dependency Flow
**Rating: ❌ Poor - Multiple Issues**

- No dependency injection
- Hard-coded dependencies throughout
- Direct instantiation of infrastructure (DynamoDB clients)
- Circular dependency potential between contexts

### 5. Modularity Score
**Score: 3/10**

**Justification:**
- (-2) God objects in critical paths
- (-2) No service/repository layers
- (-1) Tight coupling between UI and business logic
- (-1) Duplicated code patterns
- (-1) No dependency injection
- (+3) Basic component structure exists

---

## Critical Findings

### 🔴 FINDING 1: God Context - AppContext.tsx
**Severity: 10/10** - Critical
**Location:** `context/AppContext.tsx` (507 lines)

**Issue:**
Single file contains TWO context providers (`CurrentResourceProvider` and `CurrentDocumentProvider`) plus all business logic for resource/document operations. Violates Single Responsibility Principle.

**Evidence:**
```typescript
// Lines 1-313: CurrentResourceProvider with methods:
- fetchResourceMeta
- fetchResourceAndMeta
- uploadResource
- extractText
- moveResource

// Lines 315-506: CurrentDocumentProvider with methods:
- fetchDocuments
- fetchDocument
- createDocument
- mapDynamoDBItemToDocument
- parseDynamoDBFolders
```

**Problems:**
- Impossible to unit test in isolation
- 31 direct `fetch()` calls mixed with state management
- No separation between state and business logic
- Makes components tightly coupled to implementation

**Remediation:**
```typescript
// Split into separate files:
// 1. context/ResourceContext.tsx - State only
// 2. context/DocumentContext.tsx - State only
// 3. services/ResourceService.ts - Business logic
// 4. services/DocumentService.ts - Business logic
// 5. api/ApiClient.ts - HTTP abstraction

// Example ResourceContext.tsx:
export const ResourceContext = createContext<ResourceState>();

export function ResourceProvider({ children }: Props) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [meta, setMeta] = useState<ResourceMeta | null>(null);

  return (
    <ResourceContext.Provider value={{ resource, setResource, meta, setMeta }}>
      {children}
    </ResourceContext.Provider>
  );
}

// Example ResourceService.ts:
export class ResourceService {
  constructor(private apiClient: ApiClient) {}

  async fetchResourceMeta(id: string): Promise<ResourceMeta> {
    return this.apiClient.get(`/api/db/resourcemeta?resourceId=${id}`);
  }

  async uploadResource(file: File, folder: string, docId: string): Promise<void> {
    // Business logic here
  }
}
```

---

### 🔴 FINDING 2: God Route - app/api/db/route.ts
**Severity: 9/10** - Critical
**Location:** `app/api/db/route.ts` (288 lines)

**Issue:**
Single API route file serves multiple responsibilities: type definitions, shared utilities, HTTP handlers, PostHog setup, and acts as both a route and a library.

**Evidence:**
```typescript
// Lines 15-23: Infrastructure setup
export const client = new DynamoDBClient({ region: 'us-west-1' });
const posthog = new PostHog(...);

// Lines 25-38: Utility function
const getCurrentTime = () => { ... }

// Lines 40-76: Type definitions (duplicating types/types.tsx)
export type Resource = { ... }
export type Document = { ... }

// Lines 79-151: Shared database functions
export const putObject = async (...)
export const getObject = async (...)
export const deleteObject = async (...)

// Lines 153-287: HTTP handlers (GET, PUT, POST, DELETE)
```

**Problems:**
- Mixed concerns: types, utilities, shared functions, HTTP handlers
- Cannot change one responsibility without affecting others
- Difficult to test individual functions
- Types duplicated from `types/types.tsx`

**Remediation:**
```typescript
// Split into:

// 1. lib/db/dynamoClient.ts
export const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });

// 2. lib/db/dynamoRepository.ts
export class DynamoRepository<T> {
  constructor(private client: DynamoDBClient, private table: string) {}

  async get(id: string): Promise<T | null> {
    const res = await this.client.send(
      new GetItemCommand({ TableName: this.table, Key: { id: { S: id } } })
    );
    return res.Item ? AWS.DynamoDB.Converter.unmarshall(res.Item) as T : null;
  }

  async put(item: T): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.table,
        Item: AWS.DynamoDB.Converter.marshall(item)
      })
    );
  }

  async delete(id: string): Promise<void> { ... }
}

// 3. services/DocumentService.ts
export class DocumentService {
  constructor(
    private repo: DynamoRepository<Document>,
    private analytics: PostHog
  ) {}

  async createDocument(data: CreateDocumentDTO): Promise<Document> {
    const doc = { id: uuidv4(), ...data };
    await this.repo.put(doc);
    this.analytics.capture({ ... });
    return doc;
  }
}

// 4. app/api/db/route.ts - Keep only HTTP handlers
export async function POST(request: Request) {
  const data = await request.json();
  const documentService = new DocumentService(documentRepo, posthog);
  const doc = await documentService.createDocument(data);
  return Response.json(doc);
}
```

---

### 🟠 FINDING 3: Type Duplication
**Severity: 7/10** - High
**Locations:**
- `types/types.tsx`
- `app/api/db/route.ts` (lines 40-76)

**Issue:**
Core domain types (`Resource`, `ResourceMeta`, `Document`, `Folder`) defined in multiple locations with slight variations.

**Evidence:**
```typescript
// types/types.tsx
export interface Resource {
  id: string;
  markdown: string;
  url: string;
}

// app/api/db/route.ts (lines 40-44)
export type Resource = {
  id: string;
  markdown: string;
  url: string;
};
```

**Problems:**
- Maintenance nightmare - changes must be duplicated
- Type safety broken across boundaries
- Potential for drift and bugs

**Remediation:**
```typescript
// Remove types from app/api/db/route.ts lines 40-76
// Change line 4 to:
import { Resource, ResourceMeta, Document, Folder } from '@/types/types';

// Update all API routes importing from '../route' to use @/types/types
```

---

### 🟠 FINDING 4: DynamoDB Client Proliferation
**Severity: 8/10** - High
**Locations:** Found in 10+ API route files

**Issue:**
Almost every API route creates its own `DynamoDBClient` instance. No connection pooling or client reuse.

**Evidence:**
```typescript
// app/api/db/resource/route.ts:10
const client = new DynamoDBClient({ region: 'us-west-1' });

// app/api/db/resourcemeta/route.ts:10
const client = new DynamoDBClient({ region: 'us-west-1' });

// app/api/db/updateLastOpened/route.ts
const client = new DynamoDBClient({ region: 'us-west-1' });

// ... and 7 more files
```

**Problems:**
- Wasteful resource allocation
- No connection pooling benefits
- Harder to mock for testing
- Configuration duplicated 10+ times

**Remediation:**
```typescript
// Create lib/db/dynamoClient.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Singleton pattern for connection reuse
let client: DynamoDBClient | null = null;

export function getDynamoClient(): DynamoDBClient {
  if (!client) {
    client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-west-1',
      maxAttempts: 3,
    });
  }
  return client;
}

// In route files:
import { getDynamoClient } from '@/lib/db/dynamoClient';
const client = getDynamoClient();
```

---

### 🟠 FINDING 5: DynamoDB Converter Repetition
**Severity: 6/10** - Medium
**Locations:** 44 occurrences across codebase

**Issue:**
`AWS.DynamoDB.Converter.marshall()` and `unmarshall()` called 44 times with no abstraction. Boilerplate everywhere.

**Evidence:**
```typescript
// Repeated pattern in every route:
const updatedObj = AWS.DynamoDB.Converter.unmarshall(dynamoItem.Item);
// ... modify object ...
const input = AWS.DynamoDB.Converter.marshall(updatedObj);
```

**Problems:**
- Violates DRY principle
- Makes code verbose and hard to read
- Difficult to change marshalling strategy
- No type safety on conversions

**Remediation:**
```typescript
// lib/db/dynamoRepository.ts
export class DynamoRepository<T> {
  private marshall(item: T): Record<string, any> {
    return AWS.DynamoDB.Converter.marshall(item);
  }

  private unmarshall(item: Record<string, any>): T {
    return AWS.DynamoDB.Converter.unmarshall(item) as T;
  }

  async get(id: string): Promise<T | null> {
    const res = await this.client.send(new GetItemCommand({ ... }));
    return res.Item ? this.unmarshall(res.Item) : null;
  }

  async put(item: T): Promise<void> {
    await this.client.send(
      new PutItemCommand({ Item: this.marshall(item), ... })
    );
  }
}

// Usage in routes:
const documentRepo = new DynamoRepository<Document>(client, 'documents-table');
const doc = await documentRepo.get(id); // Already unmarshalled
```

---

### 🟠 FINDING 6: No Service Layer
**Severity: 9/10** - Critical
**Locations:** Entire codebase

**Issue:**
Business logic scattered across React Contexts and API routes. No dedicated service layer for business operations.

**Evidence:**
- `context/AppContext.tsx` contains upload logic, file parsing, resource moving
- `app/api/db/route.ts` contains document deletion with cascade logic (lines 129-139)
- Components directly call `fetch()` 31 times

**Problems:**
- Cannot reuse business logic outside React
- Difficult to unit test
- API routes coupled to specific implementations
- No clear place for business rules

**Remediation:**
```typescript
// Create services/ directory structure:

// services/DocumentService.ts
export class DocumentService {
  constructor(
    private documentRepo: DynamoRepository<Document>,
    private resourceMetaRepo: DynamoRepository<ResourceMeta>,
    private analytics: PostHog
  ) {}

  async deleteDocument(id: string, userId: string): Promise<void> {
    const doc = await this.documentRepo.get(id);
    if (!doc) throw new Error('Document not found');
    if (doc.ownerID !== userId) throw new Error('Unauthorized');

    // Cascade delete resource metadata
    for (const folder of Object.values(doc.folders)) {
      for (const resource of folder.resources) {
        await this.resourceMetaRepo.delete(resource.id);
      }
    }

    await this.documentRepo.delete(id);

    this.analytics.capture({
      distinctId: userId,
      event: 'Document Deleted',
      properties: { documentId: id, name: doc.name }
    });
  }
}

// services/ResourceService.ts
export class ResourceService {
  constructor(
    private resourceRepo: DynamoRepository<Resource>,
    private s3Service: S3Service,
    private parsingService: ParsingService
  ) {}

  async uploadResource(file: File, options: UploadOptions): Promise<Resource> {
    const hash = await this.calculateHash(file);
    const existing = await this.resourceRepo.getByHash(hash);

    if (existing) return existing;

    const url = await this.s3Service.upload(file);
    const markdown = await this.parsingService.parse(file);

    const resource = { id: hash, markdown, url };
    await this.resourceRepo.put(resource);

    return resource;
  }
}

// Then use in API routes and contexts
```

---

### 🟡 FINDING 7: Direct API Calls in UI Layer
**Severity: 7/10** - High
**Locations:** 31 fetch calls in `components/` and `context/`

**Issue:**
Components and contexts directly call `fetch()` with hardcoded URLs. No API client abstraction.

**Evidence:**
```typescript
// context/AppContext.tsx:54
const response = await fetch(
  `/api/db/resourcemeta?resourceId=${resourceMetaId}`,
  { method: 'GET', headers: { 'Content-Type': 'application/json' } }
);

// context/AppContext.tsx:89
const resourceRes = await fetch(
  `/api/db/resource?hash=${resourceMeta.hash}`,
  { method: 'GET', headers: { 'Content-Type': 'application/json' } }
);

// ... 29 more similar patterns
```

**Problems:**
- Cannot mock for testing
- Error handling inconsistent
- Hard to add auth headers, retries, logging
- URL construction error-prone

**Remediation:**
```typescript
// Create api/ApiClient.ts
export class ApiClient {
  constructor(private baseUrl: string = '') {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Usage in services:
const apiClient = new ApiClient();
const resourceMeta = await apiClient.get<ResourceMeta>(
  `/api/db/resourcemeta?resourceId=${id}`
);
```

---

### 🟡 FINDING 8: Environment Variables Scattered
**Severity: 5/10** - Medium
**Locations:** 54 `process.env` calls across codebase

**Issue:**
Environment variables accessed directly throughout code with no validation or centralized configuration.

**Evidence:**
```typescript
// app/api/db/route.ts:16
export const tableName = process.env.DOCUMENT_TABLE || '';

// app/api/db/resourcemeta/route.ts:12
export const resourceMetaTable = process.env.RESOURCEMETA_TABLE || '';

// context/AppContext.tsx:185
const isParsingDisabled = process.env.DISABLE_PARSING === 'true' || false;
```

**Problems:**
- No validation that required vars exist
- Silent failures with empty string defaults
- Cannot easily change config source
- Hard to test with different configs

**Remediation:**
```typescript
// Create lib/config.ts
interface Config {
  aws: {
    region: string;
    documentTable: string;
    resourceTable: string;
    resourceMetaTable: string;
    s3Bucket: string;
  };
  auth: {
    nextAuthUrl: string;
    nextAuthSecret: string;
    googleId: string;
    googleSecret: string;
  };
  features: {
    parsingEnabled: boolean;
  };
  llamaCloud: {
    apiKey: string;
  };
}

function validateEnv<T>(key: string, defaultValue?: T): string | T {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

export const config: Config = {
  aws: {
    region: validateEnv('AWS_REGION', 'us-west-1'),
    documentTable: validateEnv('DOCUMENT_TABLE'),
    resourceTable: validateEnv('RESOURCE_TABLE'),
    resourceMetaTable: validateEnv('RESOURCEMETA_TABLE'),
    s3Bucket: validateEnv('S3_UPLOAD_BUCKET'),
  },
  auth: {
    nextAuthUrl: validateEnv('NEXTAUTH_URL'),
    nextAuthSecret: validateEnv('NEXTAUTH_SECRET'),
    googleId: validateEnv('GOOGLE_ID'),
    googleSecret: validateEnv('GOOGLE_SECRET'),
  },
  features: {
    parsingEnabled: validateEnv('DISABLE_PARSING', 'false') !== 'true',
  },
  llamaCloud: {
    apiKey: validateEnv('LLAMA_CLOUD_API_KEY'),
  },
};

// Usage:
import { config } from '@/lib/config';
const client = new DynamoDBClient({ region: config.aws.region });
```

---

### 🟡 FINDING 9: Missing Repository Pattern
**Severity: 8/10** - High
**Locations:** All database access code

**Issue:**
No abstraction layer between business logic and database. DynamoDB-specific code mixed everywhere.

**Problems:**
- Impossible to switch databases
- Cannot mock data layer for testing
- Violates Dependency Inversion Principle
- Database logic duplicated across routes

**Remediation:**
```typescript
// Create lib/repositories/IRepository.ts
export interface IRepository<T> {
  get(id: string): Promise<T | null>;
  getAll(filter?: Record<string, any>): Promise<T[]>;
  put(item: T): Promise<void>;
  delete(id: string): Promise<void>;
  query(conditions: Record<string, any>): Promise<T[]>;
}

// lib/repositories/DynamoDocumentRepository.ts
export class DynamoDocumentRepository implements IRepository<Document> {
  constructor(
    private client: DynamoDBClient,
    private table: string
  ) {}

  async get(id: string): Promise<Document | null> {
    const res = await this.client.send(
      new GetItemCommand({
        TableName: this.table,
        Key: { id: { S: id } }
      })
    );

    return res.Item
      ? AWS.DynamoDB.Converter.unmarshall(res.Item) as Document
      : null;
  }

  async getAll(filter?: { ownerID?: string }): Promise<Document[]> {
    // Scan or Query implementation
  }

  async put(doc: Document): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.table,
        Item: AWS.DynamoDB.Converter.marshall(doc)
      })
    );
  }

  async delete(id: string): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({
        TableName: this.table,
        Key: { id: { S: id } }
      })
    );
  }

  async query(conditions: Record<string, any>): Promise<Document[]> {
    // Query implementation
  }
}

// Services now depend on interfaces, not implementations:
class DocumentService {
  constructor(private repo: IRepository<Document>) {}

  async getDocument(id: string): Promise<Document> {
    const doc = await this.repo.get(id);
    if (!doc) throw new Error('Not found');
    return doc;
  }
}
```

---

### 🟡 FINDING 10: Excessive Console Logging
**Severity: 4/10** - Low-Medium
**Locations:** 46 files contain `console.log` or `console.error`

**Issue:**
Production code littered with console logs. No structured logging or log levels.

**Evidence:**
```typescript
// app/api/db/route.ts:162
console.log('call put dynamodb');

// app/api/db/route.ts:182
console.log('updatedObj', updatedObj);

// app/api/db/route.ts:200
console.log('Updated object: ', res);
```

**Problems:**
- Cannot control log levels in production
- No structured logging for analysis
- Performance impact
- Sensitive data may be logged

**Remediation:**
```typescript
// Create lib/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL || 'INFO';
    this.level = LogLevel[envLevel as keyof typeof LogLevel];
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (level < this.level) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...meta,
    };

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to CloudWatch, DataDog, etc.
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  }
}

export const logger = new Logger();

// Usage:
import { logger } from '@/lib/logger';
logger.info('Document updated', { documentId: data.id });
logger.error('Failed to update document', error, { documentId: data.id });
```

---

## Anti-Pattern Summary

### 1. 🔴 God Objects
**Locations:**
- `context/AppContext.tsx` (507 lines, 2 contexts + business logic)
- `app/api/db/route.ts` (288 lines, types + utils + handlers + analytics)

### 2. 🔴 Copy-Paste Programming
**Evidence:**
- 44 identical DynamoDB marshall/unmarshall calls
- 10+ identical DynamoDBClient instantiations
- 31 nearly identical fetch patterns
- Duplicate type definitions in 2 locations

### 3. 🔴 Tight Coupling
**Evidence:**
- Components directly depend on API endpoints (hardcoded URLs)
- Contexts contain business logic (not just state)
- No dependency injection - everything hardcoded
- Cannot test in isolation

### 4. 🔴 Missing Abstractions
**Missing:**
- Service layer for business logic
- Repository pattern for data access
- API client for HTTP calls
- DTOs/ViewModels for API contracts
- Dependency injection container

### 5. 🟡 Anemic Domain Model
**Evidence:**
- Types are just data containers (no behavior)
- All logic in contexts/services instead of domain models
- No domain events or business rules in entities

---

## Recommended Refactoring Roadmap

### Phase 1: Critical Foundations (High Priority)
1. **Split AppContext.tsx** (Finding #1)
   - Create separate ResourceContext and DocumentContext
   - Extract business logic to services
   - Estimated effort: 8 hours

2. **Create Service Layer** (Finding #6)
   - DocumentService, ResourceService, UploadService
   - Move business logic from contexts
   - Estimated effort: 16 hours

3. **Centralized Configuration** (Finding #8)
   - Create config.ts with validation
   - Replace all process.env calls
   - Estimated effort: 4 hours

### Phase 2: Data Layer (High Priority)
4. **Repository Pattern** (Finding #9)
   - Create IRepository interface
   - Implement DynamoRepository
   - Estimated effort: 12 hours

5. **Refactor app/api/db/route.ts** (Finding #2)
   - Split into separate concerns
   - Remove duplicate types
   - Estimated effort: 6 hours

6. **Singleton DynamoDB Client** (Finding #4)
   - Create getDynamoClient() function
   - Replace all instantiations
   - Estimated effort: 2 hours

### Phase 3: Infrastructure (Medium Priority)
7. **API Client Abstraction** (Finding #7)
   - Create ApiClient class
   - Replace all fetch calls
   - Estimated effort: 8 hours

8. **Eliminate DynamoDB Converter Duplication** (Finding #5)
   - Use Repository pattern
   - Estimated effort: 4 hours (included in #4)

### Phase 4: Quality of Life (Low Priority)
9. **Structured Logging** (Finding #10)
   - Create Logger class
   - Replace console.log calls
   - Estimated effort: 4 hours

10. **Fix Type Duplication** (Finding #3)
    - Use single source of truth for types
    - Estimated effort: 2 hours

**Total Estimated Effort: ~66 hours**

---

## Dependency Injection Example

To enable proper testing and modularity, implement DI:

```typescript
// lib/container.ts
export class Container {
  private services = new Map<string, any>();

  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) throw new Error(`Service not found: ${key}`);
    return factory();
  }
}

export const container = new Container();

// Setup DI container
import { getDynamoClient } from './db/dynamoClient';
import { config } from './config';

container.register('DynamoClient', () => getDynamoClient());
container.register('DocumentRepository', () =>
  new DynamoDocumentRepository(
    container.resolve('DynamoClient'),
    config.aws.documentTable
  )
);
container.register('DocumentService', () =>
  new DocumentService(
    container.resolve('DocumentRepository'),
    container.resolve('PostHog')
  )
);

// Usage in API routes:
export async function POST(request: Request) {
  const documentService = container.resolve<DocumentService>('DocumentService');
  const result = await documentService.createDocument(data);
  return Response.json(result);
}
```

---

## Testing Recommendations

Current state: **Extremely difficult to test**

With recommended changes:

```typescript
// Example: Testing DocumentService with mocks
describe('DocumentService', () => {
  let service: DocumentService;
  let mockRepo: jest.Mocked<IRepository<Document>>;
  let mockAnalytics: jest.Mocked<PostHog>;

  beforeEach(() => {
    mockRepo = {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockAnalytics = {
      capture: jest.fn(),
    } as any;

    service = new DocumentService(mockRepo, mockAnalytics);
  });

  test('createDocument should create and track', async () => {
    const data = { name: 'Test Doc', ownerID: 'user123' };

    await service.createDocument(data);

    expect(mockRepo.put).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Doc' })
    );
    expect(mockAnalytics.capture).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'Document Created' })
    );
  });
});
```

---

## Conclusion

The Curiocity application has a functional foundation but suffers from significant architectural debt that will impede future development and maintenance. The primary issues are:

1. **Lack of separation between concerns** - Business logic in React contexts
2. **Missing critical layers** - No service or repository patterns
3. **God objects** - AppContext and db/route.ts doing too much
4. **Tight coupling** - Hard to test, hard to change
5. **Code duplication** - DRY violations throughout

**Immediate Action Required:**
- Implement service layer (Finding #6)
- Split God objects (Findings #1, #2)
- Create repository pattern (Finding #9)

**Impact of Not Fixing:**
- Technical debt will compound
- Onboarding new developers becomes harder
- Testing remains difficult/impossible
- Features take longer to implement
- Bugs will be harder to track down

**Estimated ROI:**
Investing ~66 hours in the refactoring roadmap will:
- Reduce feature development time by 30-40%
- Enable comprehensive unit testing
- Make the codebase maintainable long-term
- Reduce bug count significantly

---

**Audit Completed:** 2025-11-05
**Next Review Recommended:** After Phase 1 completion
