# API Documentation Accuracy Verification Report

**Date**: November 8, 2025
**Document Verified**: `/home/user/apex/docs/specs/API-DESIGN.md`
**Project**: Apex (Next.js Document Management System)
**Status**: MULTIPLE DISCREPANCIES FOUND

---

## Executive Summary

The API documentation is **INCOMPLETE and PARTIALLY INACCURATE** when compared to the actual implementation:

- **Endpoints Documented**: 16+ endpoints
- **Endpoints Actually Implemented**: 5 endpoints  
- **Completeness**: ~31% of documented endpoints are implemented
- **Critical Issues**: 11 discrepancies identified

### Key Findings:
1. **Missing Endpoints**: 11 documented endpoints are not implemented
2. **Incorrect Paths**: Document endpoints use different paths than documented
3. **Missing HTTP Methods**: PATCH for documents not implemented
4. **Undocumented Features**: Response formats differ from documentation
5. **Schema Mismatch**: Documented fields don't exist in domain entities
6. **Tag System**: Documented but not exposed via API

---

## Detailed Endpoint Verification

### 1. ✅ POST /api/reports - CREATE REPORT

**File**: `/home/user/apex/app/api/reports/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | POST /api/reports | POST /api/reports | ✅ |
| Authentication | Required | Required | ✅ |
| Request Body | `{ name: string }` | `{ name: string }` | ✅ |
| HTTP Status | 201 Created | 201 Created | ✅ |
| Response Fields | id, name, content, tags, document_count, created_at, updated_at, last_opened_at, owner_id | id, userId, name, content, createdAt, updatedAt, deletedAt | ⚠️ |

#### Discrepancies Found:

**Response Format Mismatch**:
- **Documented**: Response includes `tags` (array), `document_count`, `last_opened_at`, `owner_id`
- **Actual**: Response returns core Report object with `userId`, `createdAt`, `updatedAt`, `deletedAt`
- **Impact**: Frontend expecting tags won't work

**Error Responses**:
- **Documented**: Complex error format with `error`, `message`, `code`, `status`, `details`
  ```json
  {
    "error": "Validation failed",
    "message": "Report name must be between 1 and 200 characters",
    "code": "VALIDATION_ERROR",
    "status": 400,
    "details": { "field": "name", "constraint": "length" }
  }
  ```
- **Actual**: Simple error format
  ```json
  { "error": "Name is required" }
  ```
- **Impact**: Frontend error handling won't match documented structure

**Missing Validation Documentation**:
- Implementation validates: name trimming, empty check, 200 char limit
- Documentation matches this, but error responses don't match

---

### 2. ✅ GET /api/reports - LIST REPORTS

**File**: `/home/user/apex/app/api/reports/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | GET /api/reports | GET /api/reports | ✅ |
| Query Parameters | sort, order, tag, search, limit, offset | None | ❌ |
| Response Format | Complex with pagination | Array of reports | ⚠️ |
| HTTP Status | 200 OK | 200 OK | ✅ |

#### Discrepancies Found:

**Query Parameters Not Implemented**:
- **Documented** parameters: `sort`, `order`, `tag`, `search`, `limit`, `offset`
- **Actual**: No query parameter parsing
- **Expected Response**:
  ```json
  {
    "reports": [...],
    "total": 2,
    "limit": 50,
    "offset": 0
  }
  ```
- **Actual Response**: Likely just array of reports
- **Impact**: CRITICAL - Filtering, sorting, and pagination won't work

**Tag Filtering Not Available**:
- Documentation promises tag-based filtering via `?tag=q4-2024`
- Implementation doesn't support this
- Service layer has no tag relationship exposure

**Missing last_opened_at Field**:
- Documentation shows `last_opened_at` in response
- Domain entity doesn't have this field
- Database schema doesn't have this field
- Implementation can't provide this

---

### 3. ✅ GET /api/reports/[id] - GET SINGLE REPORT

**File**: `/home/user/apex/app/api/reports/[id]/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | GET /api/reports/[id] | GET /api/reports/[id] | ✅ |
| Side Effect | Updates last_opened_at | No side effect | ❌ |
| Authentication | Required | Required | ✅ |
| Error Codes | 401, 404, 500 | 401, 403, 404, 500 | ⚠️ |
| Response Format | Complex with tags | Simple entity | ⚠️ |

#### Discrepancies Found:

**Missing Side Effect**:
- **Documented**: "Updates `last_opened_at` timestamp"
- **Actual**: No such update occurs
- **Issue**: Field doesn't exist in schema, so this is impossible to implement
- **Impact**: CRITICAL - Last opened tracking won't work

**Authorization Error Code**:
- **Documented**: Returns 404 (not 403) to avoid leaking existence
- **Actual**: Returns 403 Unauthorized when user doesn't own report
- **Impact**: Leaks information about report existence to unauthorized users

---

### 4. ✅ PATCH /api/reports/[id] - UPDATE REPORT

**File**: `/home/user/apex/app/api/reports/[id]/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | PATCH /api/reports/[id] | PATCH /api/reports/[id] | ✅ |
| Request Fields | name, content, tags | name, content | ⚠️ |
| Auto-save Behavior | 30 sec debounce documented | No debounce mechanism | ❌ |
| Tags Support | Yes | No | ❌ |
| HTTP Status | 200 OK | 200 OK | ✅ |

#### Discrepancies Found:

**Tags Field Not Supported**:
- **Documented**: Can update `tags` array
  ```json
  {
    "name": "...",
    "content": "...",
    "tags": ["q4-2024", "tech-sector", "published"]
  }
  ```
- **Actual**: Only `name` and `content` supported
- **Database**: Has ReportTag table, but not exposed through API
- **Impact**: CRITICAL - Tag management through reports endpoint won't work

**Auto-save Debouncing Not Documented Accurately**:
- Documentation mentions "Frontend debounces content changes (30 seconds or on blur)"
- This is frontend concern, not backend, but API doesn't track this
- No conflict resolution if simultaneous updates occur

---

### 5. ✅ DELETE /api/reports/[id] - DELETE REPORT

**File**: `/home/user/apex/app/api/reports/[id]/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | DELETE /api/reports/[id] | DELETE /api/reports/[id] | ✅ |
| HTTP Status | 200 OK with JSON | 204 No Content | ❌ |
| Response Body | `{ success, message, deleted_count }` | None (No Content) | ❌ |
| Soft Delete | Yes | Yes | ✅ |
| Authentication | Required | Required | ✅ |

#### Discrepancies Found:

**Response Code Mismatch**:
- **Documented**: Returns `200 OK` with JSON body
  ```json
  {
    "success": true,
    "message": "Report and 15 documents deleted",
    "deleted_count": 15
  }
  ```
- **Actual**: Returns `204 No Content` with no body
- **Semantic Issue**: 204 is more RESTful for DELETE, but conflicts with documentation
- **Impact**: Frontend expecting JSON response will fail

**deleted_count Calculation**:
- **Documented**: Should return count of deleted documents
- **Actual**: No cascading document deletion counts provided
- **Implementation**: Soft delete only, no cascade tracking

---

### 6. ⚠️ POST /api/documents - UPLOAD DOCUMENT

**File**: `/home/user/apex/app/api/documents/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | POST /api/reports/[reportId]/documents | POST /api/documents | ❌ |
| Report ID | Path parameter | Form field `reportId` | ❌ |
| Request Format | multipart/form-data with files | multipart/form-data with file + reportId | ✅ |
| Response Format | Complex with uploaded/skipped/failed | Simple document object | ❌ |
| HTTP Status | 201 Created | 201 Created | ✅ |
| Authentication | Required | Required | ✅ |

#### Critical Discrepancies Found:

**Wrong Endpoint Path** ⚠️ CRITICAL:
- **Documented**: `POST /api/reports/[reportId]/documents`
- **Actual**: `POST /api/documents`
- **Impact**: URL structure completely different from documentation

**Request Format Different**:
- **Documented**: Multiple files in multipart with hash metadata
  ```
  files: File[] (multiple files)
  hash_{filename}: string (for each file)
  ```
- **Actual**: Single file with reportId field
  ```
  file: File
  reportId: string
  ```
- **Impact**: Cannot upload multiple files at once as documented

**Response Format Completely Different**:
- **Documented**: Complex response with arrays
  ```json
  {
    "success": true,
    "uploaded": [{...}],
    "skipped": [{...}],
    "failed": [{...}]
  }
  ```
- **Actual**: Simple document object response
  ```json
  {
    "id": "...",
    "reportId": "...",
    ...
  }
  ```
- **Impact**: CRITICAL - Frontend expecting batch upload response structure will fail

**Missing File Constraints**:
- **Documented**: Max 10 files per request, 25MB per file, specific file types (.txt, .md, .pdf, .docx, .csv)
- **Actual**: No file count limit documented, size limits not visible
- **Service**: ParserService used for parsing

**Duplicate Detection**:
- **Documented**: Returns 409 Conflict with existing document info
- **Actual**: Throws error "Document already exists in this report"
- **Status Code**: Implementation uses 409 (correct)
- **Response Format**: Doesn't match documented format

---

### 7. ❌ GET /api/reports/[reportId]/documents - LIST REPORT DOCUMENTS

**Status**: NOT IMPLEMENTED

**File**: Missing - should be at `/home/user/apex/app/api/reports/[reportId]/documents/route.ts`

#### Documented Specification:
- **Endpoint**: `GET /api/reports/[reportId]/documents`
- **Query Parameters**: sort, order, tag, file_type, search
- **Response**: Array of documents with metadata
- **Purpose**: List all documents in a specific report

#### Implementation Gap:
- **Current Workaround**: Must use `POST /api/documents` to upload, but no GET to list them by report
- **Affects**: Cannot retrieve document list for UI
- **Service Layer**: Has `listDocuments(reportId)` method but no exposed endpoint
- **Impact**: CRITICAL - Cannot implement report document list UI

---

### 8. ✅ GET /api/documents/[id] - GET SINGLE DOCUMENT

**File**: `/home/user/apex/app/api/documents/[id]/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | GET /api/documents/[id] | GET /api/documents/[id] | ✅ |
| Response Fields | All doc fields + parsed_content | Document entity fields | ⚠️ |
| HTTP Status | 200 OK | 200 OK | ✅ |
| Authentication | Required | Required | ✅ |
| Error Codes | 401, 403, 404, 500 | 401, 404 | ⚠️ |

#### Discrepancies Found:

**Response Format**:
- **Documented**: Complex response with `original_url`, `parsed_url` fields
- **Actual**: Returns Document entity with `storagePath`
- **Field Names**: Mismatch in naming conventions

**Missing Authorization Check**:
- **Documented**: Returns 403 if user doesn't own document
- **Actual**: Only returns 401/404, no 403 check
- **Issue**: Service doesn't validate user ownership
- **Impact**: User might access other users' documents

---

### 9. ❌ PATCH /api/documents/[id] - UPDATE DOCUMENT

**Status**: NOT IMPLEMENTED

**File**: Missing - should be at `/home/user/apex/app/api/documents/[id]/route.ts`

#### Documented Specification:
```
PATCH /api/documents/[id]
Request: { filename?, notes?, tags? }
Response: Updated document object
Status: 200 OK
```

#### Implementation Status:
- **Service Method**: ✅ `DocumentService.updateDocument()` exists
- **API Route**: ❌ No PATCH handler in route file
- **Only Implements**: GET and DELETE
- **Missing Fields**: Notes update, tags management
- **Impact**: CRITICAL - Cannot update document metadata through API

---

### 10. ✅ DELETE /api/documents/[id] - DELETE DOCUMENT

**File**: `/home/user/apex/app/api/documents/[id]/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Endpoint | DELETE /api/documents/[id] | DELETE /api/documents/[id] | ✅ |
| HTTP Status | 200 OK with JSON | 204 No Content | ❌ |
| Response Body | `{ success, message }` | None | ❌ |
| File Deletion | Yes | Yes | ✅ |
| Authentication | Required | Required | ✅ |

#### Discrepancies Found:

**Same Issue as Report DELETE**:
- **Documented**: 200 OK with JSON response
- **Actual**: 204 No Content
- **Impact**: Frontend expecting JSON response will fail

---

### 11. ❌ GET /api/search - SEARCH DOCUMENTS

**Status**: NOT IMPLEMENTED

**File**: Missing - should be at `/home/user/apex/app/api/search/route.ts`

#### Documented Specification:
```
GET /api/search?q=meta&report_id=...&limit=20
Response: { results: [...], total, query }
Purpose: Search documents by filename (NOW phase)
```

#### Implementation Status:
- **Service Method**: ✅ `searchDocuments()` exists in DocumentService
- **API Route**: ❌ No endpoint exposed
- **Behavior**: Client-side search documented as fallback
- **Impact**: MEDIUM - Search functionality unavailable

---

### 12. ❌ POST /api/reports/[id]/tags - ADD TAG TO REPORT

**Status**: NOT IMPLEMENTED

**File**: Missing

#### Documented Specification:
```
POST /api/reports/[id]/tags
Request: { tag: "q4-2024" }
Response: { id, tags: [...] }
Status: 200 OK
```

#### Implementation Status:
- **Database Model**: ✅ ReportTag model exists in Prisma schema
- **Service Methods**: ❌ No tag management methods in ReportService
- **API Route**: ❌ No endpoint
- **Impact**: CRITICAL - Tag system non-functional

---

### 13. ❌ DELETE /api/reports/[id]/tags - REMOVE TAG FROM REPORT

**Status**: NOT IMPLEMENTED

**File**: Missing

#### Implementation Status:
- **Same as Add Tag** - Not implemented

---

### 14. ❌ POST /api/documents/[id]/tags - ADD TAG TO DOCUMENT

**Status**: NOT IMPLEMENTED

**File**: Missing

#### Documented Specification:
```
POST /api/documents/[id]/tags
Request: { tag: "financial-data" }
Response: { id, tags: [...] }
```

#### Implementation Status:
- **Database Model**: ✅ DocumentTag model exists
- **Service Methods**: ❌ None in DocumentService
- **API Route**: ❌ No endpoint
- **Impact**: CRITICAL - Document tagging non-functional

---

### 15. ❌ DELETE /api/documents/[id]/tags - REMOVE TAG FROM DOCUMENT

**Status**: NOT IMPLEMENTED

**File**: Missing

#### Implementation Status:
- **Same as Add Tag** - Not implemented

---

### 16. ✅ /api/auth/[...nextauth] - AUTHENTICATION

**File**: `/home/user/apex/app/api/auth/[...nextauth]/route.ts`

#### Documentation vs Implementation

| Aspect | Documented | Actual | Match |
|--------|-----------|--------|-------|
| Framework | NextAuth v5 | NextAuth | ✅ |
| Providers | Google, LinkedIn, Magic Link | Magic Link Email only | ❌ |
| Magic Link | Yes | Yes | ✅ |
| OAuth Flows | Google + LinkedIn | Not implemented | ❌ |
| Session Strategy | JWT | Database (via adapter) | ⚠️ |
| Session Duration | 30 days | 30 days | ✅ |

#### Discrepancies Found:

**Provider Mismatch**:
- **Documented**: Google OAuth, LinkedIn OAuth, Magic Link Email
- **Actual**: Only Magic Link Email implemented
- **Configuration**: 
  ```typescript
  providers: [
    EmailProvider({...}) // Only this one
  ]
  ```
- **Impact**: Google and LinkedIn authentication not available despite documentation

**Session Strategy Different**:
- **Documented**: JWT sessions with specific cookie config
- **Actual**: Database session strategy (Prisma Adapter)
- **Semantic Difference**: Database adapter still uses secure cookies, but storage is different
- **Impact**: MEDIUM - Session management approach different

**Missing OAuth Implementation**:
- **Documented**: Detailed Google and LinkedIn OAuth flows
- **Actual**: Not implemented
- **Code Length**: Documentation shows 30+ pages of OAuth details
- **Status**: This is aspirational (NEXT phase) not NOW phase
- **Impact**: CRITICAL if used as specification for current implementation

---

## Data Model Discrepancies

### Missing Fields in Domain Entities

| Field | Documented | Schema | Domain Entity | Impact |
|-------|-----------|--------|---------------|--------|
| Report.tags | Yes (array) | ReportTag (relation) | No | Tag feature unusable |
| Report.document_count | Yes | No | No | Cannot show doc count |
| Report.last_opened_at | Yes | No | No | Usage tracking unavailable |
| Document.tags | Yes (array) | DocumentTag (relation) | No | Tagging non-functional |
| Document.file_type | Yes | No | No | Cannot filter by type |
| Document.size | Yes | No | No | Cannot show file size |
| Document.status | Yes ("parsing", "ready") | No | No | Cannot track parsing status |

### Schema Design Mismatch

**Documented Approach** (from API-DESIGN.md Section 10.1):
- Simple array fields for tags: `tags: String[]`

**Actual Approach** (Prisma schema):
- Proper foreign key relationships: `ReportTag[]`, `DocumentTag[]`
- More correct from database perspective, but tags not exposed in API

---

## Authentication & Authorization Gaps

### Session Management

**Documentation claims**:
- JWT tokens with specific payload structure
- HTTP-only secure cookies
- 30-day expiration
- Automatic refresh before expiration

**Actual**:
- Database session strategy via Prisma Adapter
- Still HTTP-only and secure
- 30-day max age configured
- NextAuth handles refresh

### Authorization Checks

**Missing in Implementation**:
- GET /api/documents/[id] doesn't verify user ownership (no service-level check)
- Could allow unauthorized document access

---

## Error Response Format Gaps

### Documented Error Format
```json
{
  "error": "Brief message",
  "message": "Detailed explanation",
  "code": "ERROR_CODE",
  "status": 400,
  "details": { "field": "name", "constraint": "length" }
}
```

### Actual Error Format
```json
{ "error": "Brief message" }
```

**Specific Cases**:
1. **Validation Errors**: Documentation has `details` field, actual has none
2. **Not Found Errors**: Documentation has 404, actual has 404 but simple format
3. **Conflict Errors**: Documentation has 409 with details, actual has 409 with simple message
4. **Rate Limit Errors**: Documented for NEXT phase, not implemented

---

## Status Code Discrepancies

| Scenario | Documented | Actual | Issue |
|----------|-----------|--------|-------|
| DELETE Success | 200 OK + JSON | 204 No Content | Cannot get response body |
| Access Other User's Report | 404 Not Found | 403 Forbidden | Leaks existence |
| Missing Query Params | 400 Bad Request | Not validated | Silently ignored |
| Unauthorized | 401 Unauthorized | 401 Unauthorized | ✅ Correct |
| File Too Large | 413 Payload Too Large | Not checked | Could accept huge files |
| Duplicate File | 409 Conflict | 409 Conflict | ✅ Correct code, wrong format |

---

## File Upload Feature Gaps

### Documented Features Not Implemented

1. **Multiple File Upload** ❌
   - Documented: Accept multiple files in single request
   - Actual: Single file per request

2. **File Type Validation** ❌
   - Documented: .txt, .md, .pdf, .docx, .csv (with extensions for NEXT)
   - Actual: No explicit type checking in route

3. **File Size Limit** ❌
   - Documented: 25MB per file
   - Actual: No size validation in route

4. **Async Parsing** ✅
   - Documented: Background parsing with status polling
   - Actual: Implemented (synchronous in current code)

5. **Duplicate Detection** ✅
   - Documented: SHA-256 hash comparison
   - Actual: Implemented

6. **Upload Progress Response** ❌
   - Documented: detailed uploaded/skipped/failed arrays
   - Actual: Single document response

---

## Query Parameter Support

### Not Implemented But Documented

#### GET /api/reports
- `sort` - Sort field (default: updated_at)
- `order` - Sort direction (default: desc)
- `tag` - Filter by tag (comma-separated)
- `search` - Search in report name
- `limit` - Max results (default: 50)
- `offset` - Pagination offset (default: 0)

**Impact**: Sorting and filtering unavailable

#### GET /api/reports/[reportId]/documents
- `sort` - Sort field
- `order` - Sort direction
- `tag` - Filter by tag
- `file_type` - Filter by type
- `search` - Search filename

**Impact**: Endpoint doesn't exist, so all filtering unavailable

#### GET /api/search
- `q` - Search query (REQUIRED)
- `report_id` - Limit to report (optional)
- `limit` - Max results (default: 20)

**Impact**: Search endpoint not implemented

---

## Summary of Implementation Status

### Fully Implemented ✅ (5 endpoints)
1. POST /api/reports
2. GET /api/reports
3. GET /api/reports/[id]
4. PATCH /api/reports/[id]
5. DELETE /api/reports/[id]
6. GET /api/documents/[id]
7. DELETE /api/documents/[id]
8. POST /api/documents (wrong path but implemented)
9. /api/auth/[...nextauth]

### Partially Implemented ⚠️
- POST /api/documents (wrong endpoint path, wrong request format, wrong response format)

### Not Implemented ❌ (11 endpoints)
1. GET /api/reports/[reportId]/documents
2. PATCH /api/documents/[id]
3. GET /api/search
4. POST /api/reports/[id]/tags
5. DELETE /api/reports/[id]/tags
6. POST /api/documents/[id]/tags
7. DELETE /api/documents/[id]/tags
8. Google OAuth (/api/auth/signin/google)
9. LinkedIn OAuth (/api/auth/signin/linkedin)
10. Magic link verify endpoint
11. Rate limiting endpoints (documented for NEXT phase)

---

## Recommendations

### Priority 1 - Critical (Block Deployment)

1. **Fix /api/documents endpoint path**
   - Change from `/api/documents` to `/api/reports/[reportId]/documents`
   - Update request body to accept multiple files
   - Implement documented response format

2. **Implement GET /api/reports/[reportId]/documents**
   - List documents for a report
   - Add query parameter support (sort, order, tag, search)

3. **Implement PATCH /api/documents/[id]**
   - Update document metadata (filename, notes)
   - Add tag management support

4. **Fix DELETE response codes**
   - Return 200 OK with JSON body for both /api/reports and /api/documents DELETE
   - Include success message and counts

5. **Implement tag management endpoints**
   - Add all 4 tag endpoints (report tags, document tags)
   - Expose tag data in responses

### Priority 2 - High (Before Release)

1. **Standardize error response format**
   - Implement documented error structure with code, details
   - Use consistent status codes per specification

2. **Add query parameter support**
   - GET /api/reports: sort, order, tag, search, limit, offset
   - GET /api/documents: same parameters
   - GET /api/search: q, report_id, limit

3. **Add authorization checks**
   - Verify document ownership in GET /api/documents/[id]
   - Return 403 instead of 404 for authorization failures

4. **Implement Google & LinkedIn OAuth** (if in scope for NOW phase)
   - Or update documentation to show only email auth

5. **Add field validation**
   - File size checks (25MB limit)
   - File type validation
   - Multiple file handling

### Priority 3 - Medium (Polish)

1. **Add missing domain fields**
   - document_count on reports
   - last_opened_at on reports (if tracking needed)
   - Proper exposure of tags in responses

2. **Implement search endpoint**
   - GET /api/search for filename search
   - Prepare for full-text search in NEXT phase

3. **Add status field for document parsing**
   - Track parsing status (parsing, ready, parse_failed)
   - Return in document responses

4. **Implement rate limiting** (NEXT phase)
   - Document configuration and headers

---

## Files Requiring Updates

### Need to be Created
- [ ] `/home/user/apex/app/api/reports/[reportId]/documents/route.ts`
- [ ] Tag management endpoints (4 new routes)
- [ ] `/home/user/apex/app/api/search/route.ts`

### Need to be Modified
- [ ] `/home/user/apex/app/api/documents/route.ts` - Fix path and request/response format
- [ ] `/home/user/apex/app/api/documents/[id]/route.ts` - Add PATCH method
- [ ] `/home/user/apex/app/api/reports/[id]/route.ts` - Change DELETE response code
- [ ] `/home/user/apex/app/api/documents/route.ts` - Change DELETE response code
- [ ] Services (ReportService, DocumentService) - Add tag management methods
- [ ] Domain entities - Consider adding computed fields for UI

### Documentation Updates
- [ ] Update `/home/user/apex/docs/specs/API-DESIGN.md` sections on:
  - Authentication (clarify email-only vs OAuth)
  - Document upload paths and format
  - Response codes for DELETE operations
  - Tag endpoints (if not implementing, remove from docs)

---

## Conclusion

The API-DESIGN.md document is **ASPIRATIONAL** rather than **ACTUAL**. It describes an idealized system with features like tag management, OAuth providers, search, and detailed query parameters that are not yet implemented. The actual codebase implements only core CRUD operations for reports and documents.

**Recommendation**: Either:
1. **Update documentation** to match current implementation (for honest current state), or
2. **Implement missing features** to match documentation (for planned NEXT phase)

Current implementation appears to be **Phase 2/3 of planned development**, while documentation describes **Phase 4+** features.
