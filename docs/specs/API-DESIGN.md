# ResearchHub API Design Specification

**Version**: 1.0
**Date**: 2025-11-06
**Status**: Draft
**Target Phase**: NOW (Core MVP)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [API Endpoints](#3-api-endpoints)
4. [Request/Response Formats](#4-requestresponse-formats)
5. [Error Handling](#5-error-handling)
6. [File Upload Flow](#6-file-upload-flow)
7. [Rate Limiting](#7-rate-limiting)

---

## 1. Overview

### 1.1 API Architecture

**Framework**: Next.js App Router (v14+)
**Pattern**: RESTful API with JSON request/response
**Base URL**:
- NOW: `http://localhost:3000/api`
- NEXT: `https://researchhub.app/api`

### 1.2 Design Principles

- **RESTful conventions**: Use HTTP methods (GET, POST, PATCH, DELETE) semantically
- **Resource-based URLs**: `/api/reports/{id}` not `/api/getReport?id={id}`
- **JSON-only**: All requests and responses use `application/json` (except file uploads)
- **Consistent error format**: Standardized error response structure
- **Stateless**: Authentication via session cookie, no server-side session storage

### 1.3 Technology Stack

- **API Framework**: Next.js App Router API Routes
- **Authentication**: NextAuth.js (v5)
- **Database**: PostgreSQL (NOW: Docker, NEXT: Supabase)
- **ORM**: Prisma
- **File Storage**: Local filesystem (NOW) → Supabase Storage (NEXT)
- **File Parsing**: LlamaParse API
- **Email**: Resend.com (magic links)

### 1.4 API Versioning

**NOW Phase**: No versioning (single version, `/api/*`)
**NEXT/LATER**: Add versioning if breaking changes needed (`/api/v1/*`, `/api/v2/*`)

---

## 2. Authentication

### 2.1 Authentication Overview

**Method**: NextAuth.js with JWT sessions
**Session Storage**: HTTP-only cookie (`next-auth.session-token`)
**Session Duration**: 30 days
**Providers**: Google OAuth, LinkedIn OAuth, Magic Link Email

### 2.2 Authentication Flows

#### 2.2.1 Google OAuth Flow

**Trigger**: User clicks "Sign in with Google"

**Steps**:
1. **Client Request**: Redirect to `/api/auth/signin/google`
2. **OAuth Redirect**: NextAuth redirects to Google OAuth consent screen
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id={GOOGLE_CLIENT_ID}&
     redirect_uri=http://localhost:3000/api/auth/callback/google&
     scope=openid%20profile%20email&
     response_type=code&
     state={csrf_token}
   ```
3. **User Consent**: User approves permissions
4. **Callback**: Google redirects to `/api/auth/callback/google?code={auth_code}`
5. **Token Exchange**: NextAuth exchanges authorization code for access token
6. **User Profile Fetch**: NextAuth fetches user profile from Google
   ```json
   {
     "sub": "1234567890",
     "name": "Sarah Johnson",
     "email": "sarah@example.com",
     "picture": "https://lh3.googleusercontent.com/a/..."
   }
   ```
7. **Database Operations**:
   - **New User**: Create user record in `users` table
   - **Existing User**: Update `last_logged_in` timestamp
8. **Session Creation**: Create JWT session, set cookie
9. **Redirect**: Redirect to `/reports` (dashboard)

**Environment Variables**:
```bash
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
```

**Error Handling**:
- **OAuth Denied**: User cancels → redirect to `/login?error=OAuthAccountNotLinked`
- **Profile Fetch Failed**: API error → redirect to `/login?error=OAuthProfileError`
- **Database Error**: Save failed → show error page with retry button

---

#### 2.2.2 LinkedIn OAuth Flow

**Trigger**: User clicks "Sign in with LinkedIn"

**Steps**:
1. **Client Request**: Redirect to `/api/auth/signin/linkedin`
2. **OAuth Redirect**: NextAuth redirects to LinkedIn authorization
   ```
   https://www.linkedin.com/oauth/v2/authorization?
     client_id={LINKEDIN_CLIENT_ID}&
     redirect_uri=http://localhost:3000/api/auth/callback/linkedin&
     scope=openid%20profile%20email&
     response_type=code&
     state={csrf_token}
   ```
3. **User Consent**: User approves permissions
4. **Callback**: LinkedIn redirects to `/api/auth/callback/linkedin?code={auth_code}`
5. **Token Exchange**: NextAuth exchanges code for access token
6. **User Profile Fetch**: Fetch from LinkedIn API v2
   ```json
   {
     "sub": "linkedin-user-id",
     "name": "Sarah Johnson",
     "email": "sarah@example.com",
     "picture": "https://media.licdn.com/..."
   }
   ```
7. **Database Operations**: Same as Google OAuth
8. **Session Creation**: Create JWT, set cookie
9. **Redirect**: Redirect to `/reports`

**Environment Variables**:
```bash
LINKEDIN_CLIENT_ID=86abc...
LINKEDIN_CLIENT_SECRET=abc123...
```

**Scopes Required**: `openid`, `profile`, `email`

---

#### 2.2.3 Magic Link Email Flow

**Trigger**: User enters email and clicks "Send magic link"

**Steps**:

**Part 1: Send Magic Link**
1. **Client Request**: POST to `/api/auth/magic-link`
   ```json
   {
     "email": "sarah@example.com"
   }
   ```
2. **Token Generation**: Server generates secure token
   ```typescript
   const token = crypto.randomBytes(32).toString('hex');
   const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
   ```
3. **Database Save**: Store token in `magic_link_tokens` table
   ```sql
   INSERT INTO magic_link_tokens (email, token, expires_at, used)
   VALUES ('sarah@example.com', '{token}', '{expiresAt}', false);
   ```
4. **Email Send**: Send via Resend API
   ```typescript
   await resend.emails.send({
     from: 'ResearchHub <noreply@researchhub.app>',
     to: 'sarah@example.com',
     subject: 'Sign in to ResearchHub',
     html: magicLinkEmailTemplate({
       url: `http://localhost:3000/api/auth/magic-link/verify?token=${token}&email=${encodeURIComponent(email)}`
     })
   });
   ```
5. **Client Response**: Return success (don't reveal if email exists)
   ```json
   {
     "success": true,
     "message": "If an account exists, a magic link has been sent."
   }
   ```

**Part 2: Verify Magic Link**
1. **User Clicks Link**: Browser navigates to verification URL
   ```
   http://localhost:3000/api/auth/magic-link/verify?token={token}&email={email}
   ```
2. **Server Validation**: Check token validity
   - Token exists in database
   - Token not expired (< 15 minutes old)
   - Token not already used
   - Email matches
3. **Database Lookup/Create**:
   - **Existing User**: Fetch user record
   - **New User**: Create user record
   ```sql
   INSERT INTO users (id, email, name, created_at, last_logged_in)
   VALUES (uuid_generate_v4(), 'sarah@example.com', 'sarah@example.com', NOW(), NOW())
   ON CONFLICT (email) DO UPDATE SET last_logged_in = NOW();
   ```
4. **Mark Token Used**: Update token record
   ```sql
   UPDATE magic_link_tokens
   SET used = true
   WHERE token = '{token}';
   ```
5. **Session Creation**: Create NextAuth session
6. **Redirect**: Redirect to `/reports`

**Token Cleanup**: Background job deletes expired tokens daily

**Environment Variables**:
```bash
RESEND_API_KEY=re_abc123...
```

**Error Handling**:
- **Invalid Token**: Redirect to `/login?error=InvalidToken`
- **Expired Token**: Redirect to `/login?error=ExpiredToken`
- **Already Used**: Redirect to `/login?error=TokenAlreadyUsed`
- **Email Send Failed**: Return 500, log error (retry logic in background)

---

### 2.3 Session Management

**Session Structure** (JWT payload):
```typescript
{
  id: string;           // User UUID
  name: string;         // User display name
  email: string;        // User email
  image: string | null; // Profile picture URL
  iat: number;          // Issued at (Unix timestamp)
  exp: number;          // Expires at (Unix timestamp)
}
```

**Cookie Configuration**:
```typescript
{
  name: 'next-auth.session-token',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/'
}
```

**Session Retrieval** (in API routes):
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Access user data
  const userId = session.user.id;
  // ...
}
```

**Token Refresh**: Automatic (NextAuth handles JWT refresh before expiration)

**Sign Out**:
- **Endpoint**: `/api/auth/signout` (POST)
- **Action**: Clears session cookie, invalidates JWT
- **Redirect**: `/login`

---

## 3. API Endpoints

### 3.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/signin` | NextAuth sign-in page (auto-generated) |
| POST | `/api/auth/signin/{provider}` | Initiate OAuth flow (Google, LinkedIn) |
| GET | `/api/auth/callback/{provider}` | OAuth callback handler |
| POST | `/api/auth/signout` | Sign out user, clear session |
| POST | `/api/auth/magic-link` | Send magic link email |
| GET | `/api/auth/magic-link/verify` | Verify magic link token |
| GET | `/api/auth/session` | Get current session (NextAuth built-in) |

---

### 3.2 Reports Endpoints

#### POST `/api/reports`
**Description**: Create a new report

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Q4 2024 Tech Sector Analysis"
}
```

**Validation Rules**:
- `name`: Required, 1-200 characters, trim whitespace

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q4 2024 Tech Sector Analysis",
  "content": "",
  "tags": [],
  "document_count": 0,
  "created_at": "2024-11-06T15:30:00Z",
  "updated_at": "2024-11-06T15:30:00Z",
  "last_opened_at": "2024-11-06T15:30:00Z",
  "owner_id": "user-123"
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **400 Bad Request**: Invalid name (empty, too long)
- **500 Internal Server Error**: Database error

**Example**:
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"name": "Q4 2024 Tech Sector Analysis"}'
```

---

#### GET `/api/reports`
**Description**: List all reports for authenticated user

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | string | No | `updated_at` | Sort field: `name`, `created_at`, `updated_at` |
| `order` | string | No | `desc` | Sort order: `asc`, `desc` |
| `tag` | string | No | - | Filter by tag (comma-separated for multiple) |
| `search` | string | No | - | Search in report name (case-insensitive) |
| `limit` | number | No | 50 | Max results (1-100) |
| `offset` | number | No | 0 | Pagination offset |

**Response** (200 OK):
```json
{
  "reports": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Q4 2024 Tech Sector Analysis",
      "content": "# Executive Summary\n\nQ4 results show...",
      "tags": ["q4-2024", "tech-sector"],
      "document_count": 15,
      "created_at": "2024-10-01T10:00:00Z",
      "updated_at": "2024-11-06T15:30:00Z",
      "last_opened_at": "2024-11-06T14:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Q3 2024 Financial Services Analysis",
      "content": "# Overview\n\nFinancial sector...",
      "tags": ["q3-2024", "financial-services"],
      "document_count": 23,
      "created_at": "2024-07-15T09:00:00Z",
      "updated_at": "2024-09-30T17:00:00Z",
      "last_opened_at": "2024-10-05T11:30:00Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

**Example Queries**:
```bash
# Get all reports, sorted by last updated
GET /api/reports?sort=updated_at&order=desc

# Search for "tech" reports
GET /api/reports?search=tech

# Filter by tag
GET /api/reports?tag=q4-2024

# Filter by multiple tags (AND logic)
GET /api/reports?tag=q4-2024,tech-sector

# Pagination (second page, 20 per page)
GET /api/reports?limit=20&offset=20
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **400 Bad Request**: Invalid query parameters

---

#### GET `/api/reports/[id]`
**Description**: Get a single report by ID

**Authentication**: Required

**Path Parameters**:
- `id`: Report UUID

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q4 2024 Tech Sector Analysis",
  "content": "# Executive Summary\n\nQ4 results show strong growth...",
  "tags": ["q4-2024", "tech-sector"],
  "document_count": 15,
  "created_at": "2024-10-01T10:00:00Z",
  "updated_at": "2024-11-06T15:30:00Z",
  "last_opened_at": "2024-11-06T14:00:00Z",
  "owner_id": "user-123"
}
```

**Side Effect**: Updates `last_opened_at` timestamp

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Report doesn't exist or user doesn't have access
- **500 Internal Server Error**: Database error

**Example**:
```bash
curl -X GET http://localhost:3000/api/reports/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: next-auth.session-token=..."
```

---

#### PATCH `/api/reports/[id]`
**Description**: Update report (name, content, tags)

**Authentication**: Required

**Path Parameters**:
- `id`: Report UUID

**Request Body** (partial update):
```json
{
  "name": "Q4 2024 Tech Sector Analysis - FINAL",
  "content": "# Executive Summary\n\nUpdated content...",
  "tags": ["q4-2024", "tech-sector", "published"]
}
```

**Validation Rules**:
- `name`: Optional, 1-200 characters if provided
- `content`: Optional, 0-1,000,000 characters if provided
- `tags`: Optional, array of strings (max 20 tags, each 1-50 characters)

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q4 2024 Tech Sector Analysis - FINAL",
  "content": "# Executive Summary\n\nUpdated content...",
  "tags": ["q4-2024", "tech-sector", "published"],
  "document_count": 15,
  "created_at": "2024-10-01T10:00:00Z",
  "updated_at": "2024-11-06T16:00:00Z",
  "last_opened_at": "2024-11-06T14:00:00Z"
}
```

**Auto-Save Behavior**:
- Frontend debounces content changes (30 seconds or on blur)
- Backend updates `updated_at` timestamp on every change

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own this report
- **404 Not Found**: Report doesn't exist
- **400 Bad Request**: Invalid data (name too long, too many tags, etc.)
- **500 Internal Server Error**: Database error

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/reports/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"content": "# Updated Content\n\nNew paragraph..."}'
```

---

#### DELETE `/api/reports/[id]`
**Description**: Delete report and all associated documents

**Authentication**: Required

**Path Parameters**:
- `id`: Report UUID

**Request Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Report and 15 documents deleted",
  "deleted_count": 15
}
```

**Side Effects**:
- Deletes all documents associated with report from database
- Deletes all document files from storage (local filesystem or Supabase)
- Cascade deletes document metadata, tags, notes

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own this report
- **404 Not Found**: Report doesn't exist
- **500 Internal Server Error**: Database or file deletion error

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/reports/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: next-auth.session-token=..."
```

---

### 3.3 Documents Endpoints

#### POST `/api/reports/[reportId]/documents`
**Description**: Upload document(s) to a report

**Authentication**: Required

**Path Parameters**:
- `reportId`: Report UUID

**Request Type**: `multipart/form-data`

**Form Fields**:
```
files: File[] (multiple files supported)
```

**File Constraints**:
- **Max size**: 25MB per file (LlamaParse limit)
- **Supported types** (NOW): `.txt`, `.md`
- **Supported types** (NEXT): `.txt`, `.md`, `.pdf`, `.docx`, `.csv`
- **Max files per request**: 10 files

**Response** (201 Created):
```json
{
  "success": true,
  "uploaded": [
    {
      "id": "doc-uuid-1",
      "filename": "earnings-q3-meta.txt",
      "size": 102400,
      "file_type": "txt",
      "status": "parsing",
      "message": "Upload successful, parsing in progress"
    },
    {
      "id": "doc-uuid-2",
      "filename": "earnings-q3-alphabet.txt",
      "size": 156800,
      "file_type": "txt",
      "status": "parsing",
      "message": "Upload successful, parsing in progress"
    }
  ],
  "skipped": [
    {
      "filename": "earnings-q3-meta.txt",
      "reason": "duplicate",
      "message": "File with same hash already exists",
      "existing_id": "doc-uuid-existing"
    }
  ],
  "failed": [
    {
      "filename": "large-file.txt",
      "reason": "file_too_large",
      "message": "File size exceeds 25MB limit"
    }
  ]
}
```

**Upload Flow** (see section 6 for detailed flow):
1. Receive file(s)
2. Calculate SHA-256 hash for each file
3. Check for duplicates (hash + report_id)
4. Save original file to storage
5. Create document record in database (status: `parsing`)
6. Send to LlamaParse API (async)
7. Poll for parsing completion
8. Save parsed markdown
9. Update document status to `ready`

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own report
- **404 Not Found**: Report doesn't exist
- **400 Bad Request**: No files provided, invalid file type
- **413 Payload Too Large**: File exceeds 25MB
- **500 Internal Server Error**: Storage or database error

**Example**:
```bash
curl -X POST http://localhost:3000/api/reports/550e8400-e29b-41d4-a716-446655440000/documents \
  -H "Cookie: next-auth.session-token=..." \
  -F "files=@earnings-q3.txt" \
  -F "files=@financial-data.csv"
```

---

#### GET `/api/reports/[reportId]/documents`
**Description**: List all documents in a report

**Authentication**: Required

**Path Parameters**:
- `reportId`: Report UUID

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | string | No | `created_at` | Sort field: `filename`, `created_at`, `updated_at`, `size` |
| `order` | string | No | `desc` | Sort order: `asc`, `desc` |
| `tag` | string | No | - | Filter by tag (comma-separated) |
| `file_type` | string | No | - | Filter by file type: `txt`, `md`, `pdf`, etc. |
| `search` | string | No | - | Search in filename (case-insensitive) |

**Response** (200 OK):
```json
{
  "documents": [
    {
      "id": "doc-uuid-1",
      "report_id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "earnings-q3-meta.txt",
      "file_type": "txt",
      "size": 102400,
      "hash": "a1b2c3d4...",
      "tags": ["financial-data", "q3-2024"],
      "status": "ready",
      "created_at": "2024-11-06T10:00:00Z",
      "updated_at": "2024-11-06T10:02:00Z",
      "original_url": "/storage/reports/550e.../doc-uuid-1.txt",
      "parsed_url": "/storage/reports/550e.../doc-uuid-1-parsed.md"
    },
    {
      "id": "doc-uuid-2",
      "report_id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "competitor-analysis.md",
      "file_type": "md",
      "size": 45000,
      "hash": "e5f6g7h8...",
      "tags": ["competitor-analysis"],
      "status": "ready",
      "created_at": "2024-11-05T14:30:00Z",
      "updated_at": "2024-11-05T14:30:00Z",
      "original_url": "/storage/reports/550e.../doc-uuid-2.md",
      "parsed_url": "/storage/reports/550e.../doc-uuid-2-parsed.md"
    }
  ],
  "total": 15
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own report
- **404 Not Found**: Report doesn't exist

---

#### GET `/api/documents/[id]`
**Description**: Get single document (metadata + parsed content)

**Authentication**: Required

**Path Parameters**:
- `id`: Document UUID

**Response** (200 OK):
```json
{
  "id": "doc-uuid-1",
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "earnings-q3-meta.txt",
  "file_type": "txt",
  "size": 102400,
  "hash": "a1b2c3d4e5f6...",
  "tags": ["financial-data", "q3-2024"],
  "notes": "Focus on revenue guidance section, page 3. Key assumptions are questionable.",
  "status": "ready",
  "created_at": "2024-11-06T10:00:00Z",
  "updated_at": "2024-11-06T10:02:00Z",
  "parsed_content": "# Q3 2024 Earnings Report\n\n## Financial Highlights\n\n- Revenue: $31.2B (+12% YoY)\n- Operating Income: $8.5B\n...",
  "original_url": "/storage/reports/550e.../doc-uuid-1.txt"
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own document (via report ownership)
- **404 Not Found**: Document doesn't exist
- **500 Internal Server Error**: Storage read error

---

#### PATCH `/api/documents/[id]`
**Description**: Update document metadata (filename, notes, tags)

**Authentication**: Required

**Path Parameters**:
- `id`: Document UUID

**Request Body** (partial update):
```json
{
  "filename": "earnings-q3-meta-UPDATED.txt",
  "notes": "Updated notes with key insights",
  "tags": ["financial-data", "q3-2024", "reviewed"]
}
```

**Validation Rules**:
- `filename`: Optional, 1-255 characters, must include extension
- `notes`: Optional, 0-10,000 characters
- `tags`: Optional, array of strings (max 20 tags, each 1-50 characters)

**Response** (200 OK):
```json
{
  "id": "doc-uuid-1",
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "earnings-q3-meta-UPDATED.txt",
  "notes": "Updated notes with key insights",
  "tags": ["financial-data", "q3-2024", "reviewed"],
  "updated_at": "2024-11-06T16:30:00Z"
}
```

**Note**: Cannot update `parsed_content` or `original_url` (read-only)

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own document
- **404 Not Found**: Document doesn't exist
- **400 Bad Request**: Invalid data
- **500 Internal Server Error**: Database error

---

#### DELETE `/api/documents/[id]`
**Description**: Delete document (metadata + files)

**Authentication**: Required

**Path Parameters**:
- `id`: Document UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Document deleted"
}
```

**Side Effects**:
- Deletes document record from database
- Deletes original file from storage
- Deletes parsed markdown file from storage
- Decrements report's `document_count`

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own document
- **404 Not Found**: Document doesn't exist
- **500 Internal Server Error**: Database or storage error

---

### 3.4 Search Endpoints

#### GET `/api/search`
**Description**: Search documents by filename (NOW phase - filename only)

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 1 character) |
| `report_id` | string | No | Limit search to specific report |
| `limit` | number | No | Max results (default: 20, max: 100) |

**Response** (200 OK):
```json
{
  "results": [
    {
      "id": "doc-uuid-1",
      "report_id": "550e8400-e29b-41d4-a716-446655440000",
      "report_name": "Q4 2024 Tech Sector Analysis",
      "filename": "earnings-q3-meta.txt",
      "file_type": "txt",
      "match_type": "filename",
      "created_at": "2024-11-06T10:00:00Z"
    },
    {
      "id": "doc-uuid-5",
      "report_id": "660e8400-e29b-41d4-a716-446655440001",
      "report_name": "Q3 2024 Financial Analysis",
      "filename": "meta-platforms-q3.txt",
      "file_type": "txt",
      "match_type": "filename",
      "created_at": "2024-09-15T11:00:00Z"
    }
  ],
  "total": 2,
  "query": "meta"
}
```

**Search Behavior** (NOW phase):
- **Client-side search**: Frontend filters documents locally
- **Case-insensitive**: "META" matches "meta"
- **Partial match**: "earn" matches "earnings-q3.txt"
- **Filename only**: Content search in NEXT phase (requires full-text search)

**NEXT Phase Enhancement**: Full-text search in parsed content using PostgreSQL FTS or Typesense

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **400 Bad Request**: Missing or invalid query

---

### 3.5 Tag Endpoints

#### POST `/api/reports/[id]/tags`
**Description**: Add tag to report

**Authentication**: Required

**Path Parameters**:
- `id`: Report UUID

**Request Body**:
```json
{
  "tag": "q4-2024"
}
```

**Validation Rules**:
- `tag`: Required, 1-50 characters, lowercase, alphanumeric + hyphens

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tags": ["q4-2024", "tech-sector"]
}
```

**Behavior**:
- If tag already exists, no error (idempotent)
- Auto-converts to lowercase
- Replaces spaces with hyphens

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own report
- **404 Not Found**: Report doesn't exist
- **400 Bad Request**: Invalid tag format or exceeds max tags (20)

---

#### DELETE `/api/reports/[id]/tags`
**Description**: Remove tag from report

**Authentication**: Required

**Path Parameters**:
- `id`: Report UUID

**Query Parameters**:
- `tag`: Tag name to remove

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tags": ["tech-sector"]
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User doesn't own report
- **404 Not Found**: Report doesn't exist or tag doesn't exist on report

---

#### POST `/api/documents/[id]/tags`
**Description**: Add tag to document

**Authentication**: Required

**Path Parameters**:
- `id`: Document UUID

**Request Body**:
```json
{
  "tag": "financial-data"
}
```

**Response** (200 OK):
```json
{
  "id": "doc-uuid-1",
  "tags": ["financial-data", "q3-2024"]
}
```

**Error Responses**: Same as report tags

---

#### DELETE `/api/documents/[id]/tags`
**Description**: Remove tag from document

**Authentication**: Required

**Path Parameters**:
- `id`: Document UUID

**Query Parameters**:
- `tag`: Tag name to remove

**Response** (200 OK):
```json
{
  "id": "doc-uuid-1",
  "tags": ["q3-2024"]
}
```

**Error Responses**: Same as report tags

---

## 4. Request/Response Formats

### 4.1 Content Types

**Request Headers**:
- `Content-Type: application/json` (all requests except file uploads)
- `Content-Type: multipart/form-data` (file uploads only)

**Response Headers**:
- `Content-Type: application/json` (all responses)
- `Cache-Control: no-store` (all authenticated endpoints)

### 4.2 Timestamp Format

**Format**: ISO 8601 with UTC timezone
**Example**: `2024-11-06T15:30:00Z`

**Database Storage**: PostgreSQL `TIMESTAMPTZ` type
**JavaScript Conversion**: `new Date().toISOString()`

### 4.3 Error Response Format

**Structure**:
```json
{
  "error": "Brief error message",
  "message": "Detailed explanation of what went wrong",
  "code": "ERROR_CODE",
  "status": 400
}
```

**Example Errors**:

**400 Bad Request**:
```json
{
  "error": "Validation failed",
  "message": "Report name must be between 1 and 200 characters",
  "code": "VALIDATION_ERROR",
  "status": 400,
  "details": {
    "field": "name",
    "constraint": "length"
  }
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource",
  "code": "UNAUTHORIZED",
  "status": 401
}
```

**403 Forbidden**:
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this report",
  "code": "FORBIDDEN",
  "status": 403
}
```

**404 Not Found**:
```json
{
  "error": "Not found",
  "message": "Report with ID '550e8400...' does not exist",
  "code": "NOT_FOUND",
  "status": 404
}
```

**409 Conflict**:
```json
{
  "error": "Conflict",
  "message": "Document with same hash already exists in this report",
  "code": "DUPLICATE_DOCUMENT",
  "status": 409,
  "details": {
    "existing_id": "doc-uuid-123",
    "hash": "a1b2c3..."
  }
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "code": "INTERNAL_ERROR",
  "status": 500,
  "request_id": "req-abc123"
}
```

### 4.4 Validation Rules

**Report Name**:
- Min length: 1 character
- Max length: 200 characters
- Trim leading/trailing whitespace
- Must not be empty after trimming

**Report Content**:
- Max length: 1,000,000 characters (1MB plain text)
- Markdown format
- No HTML sanitization (trusted user input)

**Document Filename**:
- Min length: 1 character
- Max length: 255 characters
- Must include file extension
- Allowed characters: alphanumeric, spaces, hyphens, underscores, periods

**Tags**:
- Min length: 1 character
- Max length: 50 characters
- Max tags per report: 20
- Max tags per document: 20
- Auto-convert to lowercase
- Auto-replace spaces with hyphens
- Allowed characters: alphanumeric, hyphens

**Document Notes**:
- Max length: 10,000 characters
- Plain text only

---

## 5. Error Handling

### 5.1 HTTP Status Codes

| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (hash collision) |
| 413 | Payload Too Large | File exceeds 25MB |
| 429 | Too Many Requests | Rate limit exceeded (NEXT phase) |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Dependent service down (LlamaParse, email) |

### 5.2 Common Error Scenarios

**Scenario: User not authenticated**
```
Request: GET /api/reports
Response: 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource",
  "code": "UNAUTHORIZED",
  "status": 401
}
```

**Scenario: User tries to access another user's report**
```
Request: GET /api/reports/other-user-report-id
Response: 404 Not Found
{
  "error": "Not found",
  "message": "Report does not exist",
  "code": "NOT_FOUND",
  "status": 404
}
```
**Note**: Return 404 (not 403) to avoid leaking existence of other users' reports

**Scenario: Invalid report name**
```
Request: POST /api/reports
Body: { "name": "" }
Response: 400 Bad Request
{
  "error": "Validation failed",
  "message": "Report name is required and must be at least 1 character",
  "code": "VALIDATION_ERROR",
  "status": 400,
  "details": {
    "field": "name",
    "constraint": "required"
  }
}
```

**Scenario: File too large**
```
Request: POST /api/reports/123/documents
File: 30MB file
Response: 413 Payload Too Large
{
  "error": "File too large",
  "message": "File size must not exceed 25MB (LlamaParse limit)",
  "code": "FILE_TOO_LARGE",
  "status": 413,
  "details": {
    "max_size_bytes": 26214400,
    "actual_size_bytes": 31457280
  }
}
```

**Scenario: Duplicate document**
```
Request: POST /api/reports/123/documents
File: earnings-q3.txt (same hash as existing document)
Response: 409 Conflict
{
  "error": "Duplicate document",
  "message": "Document with same content already exists in this report",
  "code": "DUPLICATE_DOCUMENT",
  "status": 409,
  "details": {
    "existing_id": "doc-uuid-456",
    "filename": "earnings-q3.txt",
    "hash": "a1b2c3d4..."
  }
}
```

**Scenario: LlamaParse API failure**
```
Request: POST /api/reports/123/documents
File: document.txt
Response: 201 Created (partial success)
{
  "success": true,
  "uploaded": [
    {
      "id": "doc-uuid-1",
      "filename": "document.txt",
      "status": "parse_failed",
      "message": "Upload successful, but parsing failed. Original file is available.",
      "original_url": "/storage/.../doc-uuid-1.txt"
    }
  ]
}
```
**Note**: Graceful degradation - original file is accessible even if parsing fails

### 5.3 Error Logging

**Server-Side Logging**:
```typescript
// Log all errors to console (NOW) and Sentry (NEXT)
console.error('API Error:', {
  endpoint: req.url,
  method: req.method,
  error: error.message,
  stack: error.stack,
  userId: session?.user?.id,
  requestId: requestId,
  timestamp: new Date().toISOString()
});

// NEXT phase: Send to Sentry
Sentry.captureException(error, {
  tags: {
    endpoint: req.url,
    method: req.method
  },
  user: {
    id: session?.user?.id
  }
});
```

**Client-Side Error Handling**:
```typescript
try {
  const response = await fetch('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ name: reportName })
  });

  if (!response.ok) {
    const error = await response.json();
    // Show user-friendly message
    toast.error(error.message);
  }
} catch (error) {
  // Network error or unexpected error
  toast.error('An unexpected error occurred. Please try again.');
}
```

---

## 6. File Upload Flow

### 6.1 Upload Flow Diagram

```
User uploads file(s)
       ↓
[1] Client: Select file(s)
       ↓
[2] Client: Calculate file hash (SHA-256)
       ↓
[3] Client: Send multipart/form-data to POST /api/reports/{id}/documents
       ↓
[4] Server: Validate authentication
       ↓
[5] Server: Validate file (size, type)
       ↓
[6] Server: Calculate server-side hash (verify client hash)
       ↓
[7] Server: Check for duplicate (query DB by hash + report_id)
       ├─ If duplicate found:
       │    ↓
       │  [8a] Return 409 Conflict with existing document ID
       │
       └─ If unique:
            ↓
          [8b] Generate document UUID
            ↓
          [9] Save original file to storage
            │   NOW: /storage/reports/{reportId}/{documentId}.{ext}
            │   NEXT: Supabase Storage bucket
            ↓
          [10] Create document record in DB (status: 'parsing')
            ↓
          [11] Return 201 Created to client (document ID + status)
            ↓
          [12] Background: Send file to LlamaParse API
            ↓
          [13] Background: Poll LlamaParse for completion
            ↓
          [14] Background: Retrieve parsed markdown
            ↓
          [15] Background: Save parsed content to storage
            ↓
          [16] Background: Update document status to 'ready'
            ↓
          [17] Client: Poll GET /api/documents/{id} until status = 'ready'
            ↓
          [18] Client: Display parsed content
```

### 6.2 Detailed Implementation

#### Step 1-3: Client-Side Upload

```typescript
// components/DocumentUpload.tsx

async function handleFileUpload(files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    // Calculate SHA-256 hash
    const hash = await calculateFileHash(file);

    // Attach file and metadata
    formData.append('files', file);
    formData.append(`hash_${file.name}`, hash);
  }

  // Send to API
  const response = await fetch(`/api/reports/${reportId}/documents`, {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    // Handle successful upload
    result.uploaded.forEach(doc => {
      pollDocumentStatus(doc.id); // Poll for parsing completion
    });
  } else if (response.status === 409) {
    const error = await response.json();
    // Show duplicate warning
    showDuplicateModal(error.details);
  }
}

// Calculate SHA-256 hash in browser
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Poll document status until parsing completes
async function pollDocumentStatus(documentId: string) {
  const maxAttempts = 30; // 30 attempts × 2s = 60s timeout
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    const response = await fetch(`/api/documents/${documentId}`);
    const document = await response.json();

    if (document.status === 'ready') {
      clearInterval(interval);
      // Update UI: show parsed content
      showSuccessNotification(`${document.filename} is ready`);
    } else if (document.status === 'parse_failed' || attempts >= maxAttempts) {
      clearInterval(interval);
      showWarningNotification(`${document.filename} parsing failed, original file available`);
    }
  }, 2000); // Poll every 2 seconds
}
```

#### Step 4-11: Server-Side Upload Handler

```typescript
// app/api/reports/[reportId]/documents/route.ts

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  // [4] Validate authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user owns report
  const report = await prisma.report.findFirst({
    where: { id: params.reportId, owner_id: session.user.id }
  });

  if (!report) {
    return Response.json({ error: 'Report not found' }, { status: 404 });
  }

  // Parse multipart form data
  const formData = await req.formData();
  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return Response.json({ error: 'No files provided' }, { status: 400 });
  }

  const results = {
    uploaded: [],
    skipped: [],
    failed: []
  };

  // Process each file
  for (const file of files) {
    try {
      // [5] Validate file
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        results.failed.push({
          filename: file.name,
          reason: 'file_too_large',
          message: 'File size exceeds 25MB limit'
        });
        continue;
      }

      const fileType = path.extname(file.name).slice(1).toLowerCase();
      const allowedTypes = ['txt', 'md']; // NOW phase

      if (!allowedTypes.includes(fileType)) {
        results.failed.push({
          filename: file.name,
          reason: 'invalid_file_type',
          message: `File type .${fileType} not supported`
        });
        continue;
      }

      // [6] Calculate server-side hash
      const fileBuffer = await file.arrayBuffer();
      const hash = createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');

      // [7] Check for duplicate
      const existingDoc = await prisma.document.findFirst({
        where: {
          report_id: params.reportId,
          hash: hash
        }
      });

      if (existingDoc) {
        results.skipped.push({
          filename: file.name,
          reason: 'duplicate',
          message: 'File with same hash already exists',
          existing_id: existingDoc.id
        });
        continue;
      }

      // [8b] Generate document UUID
      const documentId = crypto.randomUUID();

      // [9] Save original file to storage
      const storagePath = process.env.STORAGE_PATH || './storage';
      const filePath = path.join(storagePath, 'reports', params.reportId, `${documentId}.${fileType}`);
      await writeFile(filePath, Buffer.from(fileBuffer));

      // [10] Create document record
      const document = await prisma.document.create({
        data: {
          id: documentId,
          report_id: params.reportId,
          filename: file.name,
          file_type: fileType,
          size: file.size,
          hash: hash,
          status: 'parsing',
          original_url: `/storage/reports/${params.reportId}/${documentId}.${fileType}`,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // [11] Return success
      results.uploaded.push({
        id: document.id,
        filename: document.filename,
        size: document.size,
        file_type: document.file_type,
        status: 'parsing',
        message: 'Upload successful, parsing in progress'
      });

      // [12-16] Background: Parse file (non-blocking)
      parseDocumentAsync(document.id, filePath);

    } catch (error) {
      results.failed.push({
        filename: file.name,
        reason: 'upload_failed',
        message: 'Unexpected error during upload'
      });
    }
  }

  return Response.json(results, { status: 201 });
}
```

#### Step 12-16: Background Parsing

```typescript
// lib/parsing.ts

import { LlamaParseClient } from 'llamaparse';
import { prisma } from './prisma';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

async function parseDocumentAsync(documentId: string, filePath: string) {
  try {
    // [12] Send to LlamaParse
    const llamaParse = new LlamaParseClient({
      apiKey: process.env.LLAMA_CLOUD_API_KEY
    });

    const fileBuffer = await readFile(filePath);

    const uploadResult = await llamaParse.upload({
      file: fileBuffer,
      mode: 'fast' // Fast mode for NOW phase
    });

    const jobId = uploadResult.id;

    // [13] Poll for completion
    let status = 'PENDING';
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 2s = 60s timeout

    while (status !== 'SUCCESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

      const statusResult = await llamaParse.getJobStatus(jobId);
      status = statusResult.status;
      attempts++;

      if (status === 'ERROR') {
        throw new Error('LlamaParse job failed');
      }
    }

    if (status !== 'SUCCESS') {
      throw new Error('LlamaParse timeout');
    }

    // [14] Retrieve parsed markdown
    const markdown = await llamaParse.getResult(jobId);

    // [15] Save parsed content
    const parsedPath = filePath.replace(/\.[^.]+$/, '-parsed.md');
    await writeFile(parsedPath, markdown);

    // [16] Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'ready',
        parsed_url: parsedPath.replace(process.env.STORAGE_PATH || './storage', '/storage'),
        parsed_content: markdown,
        updated_at: new Date()
      }
    });

    console.log(`Document ${documentId} parsed successfully`);

  } catch (error) {
    console.error(`Failed to parse document ${documentId}:`, error);

    // Update status to parse_failed (file still accessible)
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'parse_failed',
        updated_at: new Date()
      }
    });
  }
}
```

### 6.3 Duplicate Detection Logic

**Duplicate Check**: Compare `hash` + `report_id`

**Database Query**:
```sql
SELECT id FROM documents
WHERE report_id = $1 AND hash = $2
LIMIT 1;
```

**Cases**:
1. **Same file, same report**: Duplicate → 409 Conflict
2. **Same file, different report**: Allowed (file can be in multiple reports)
3. **Different filename, same hash**: Duplicate (content is identical)

**Example**:
```
User uploads "earnings-q3.txt" (hash: abc123)
→ File saved, status: parsing

User uploads "earnings-q3-copy.txt" (hash: abc123)
→ 409 Conflict: "Document with same content already exists"
```

### 6.4 Error Handling in Upload Flow

**Scenario: LlamaParse API down**
- **Action**: Save original file, set status to `parse_failed`
- **User Impact**: Can still access original file, parsing can be retried later
- **Response**: 201 Created with warning message

**Scenario: Storage write failure**
- **Action**: Rollback database transaction, return error
- **Response**: 500 Internal Server Error

**Scenario: Duplicate file**
- **Action**: Skip upload, return existing document ID
- **Response**: 409 Conflict with existing document details

---

## 7. Rate Limiting

### 7.1 Rate Limiting Strategy

**NOW Phase**: No rate limiting (local development, single user)

**NEXT Phase**: Rate limiting with Upstash Redis
- **Authenticated endpoints**: 100 requests/minute per user
- **Upload endpoints**: 20 uploads/minute per user (prevents abuse)
- **Magic link**: 5 requests/hour per email (prevents spam)

### 7.2 Implementation (NEXT Phase)

```typescript
// lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min
});

export async function checkRateLimit(userId: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(userId);

  if (!success) {
    throw new RateLimitError({
      limit,
      remaining: 0,
      reset: new Date(reset)
    });
  }

  return { remaining, reset };
}
```

**Rate Limit Response** (429 Too Many Requests):
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded 100 requests per minute. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "status": 429,
  "details": {
    "limit": 100,
    "remaining": 0,
    "reset_at": "2024-11-06T16:01:00Z"
  }
}
```

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 23
X-RateLimit-Reset: 1699286460
```

---

## 8. API Security

### 8.1 Security Best Practices

**Authentication**:
- ✅ All endpoints require authentication (except auth endpoints)
- ✅ Session cookies: `httpOnly`, `secure` (HTTPS), `sameSite: 'lax'`
- ✅ JWT expiration: 30 days with automatic refresh

**Authorization**:
- ✅ User can only access their own reports and documents
- ✅ Database queries filter by `owner_id = session.user.id`
- ✅ Return 404 (not 403) to avoid leaking existence of other users' data

**Input Validation**:
- ✅ Validate all user inputs (filename, tags, content length)
- ✅ Sanitize file paths (prevent directory traversal)
- ✅ File type whitelist (reject executables, scripts)

**File Upload Security**:
- ✅ File size limits (25MB)
- ✅ File type validation (extension + MIME type)
- ✅ Generate UUIDs for file storage (prevent filename collisions)
- ✅ Store files outside public directory

**Error Handling**:
- ✅ Never expose stack traces to clients
- ✅ Log detailed errors server-side only
- ✅ Return generic error messages for 500 errors

### 8.2 CORS Configuration

**NOW Phase** (localhost):
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
        ],
      },
    ];
  },
};
```

**NEXT Phase** (production):
- Same-origin only (no CORS needed)
- API and frontend served from same domain

---

## 9. API Testing

### 9.1 Testing Strategy

**Unit Tests**: Test individual API route handlers
**Integration Tests**: Test API endpoints with real database (test DB)
**E2E Tests**: Test full user flows (Playwright)

### 9.2 Example Test (Jest)

```typescript
// app/api/reports/route.test.ts

import { POST } from './route';
import { prismaMock } from '@/lib/__mocks__/prisma';

describe('POST /api/reports', () => {
  it('creates a new report', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' }
    };

    jest.spyOn(require('next-auth'), 'getServerSession').mockResolvedValue(mockSession);

    prismaMock.report.create.mockResolvedValue({
      id: 'report-123',
      name: 'Test Report',
      content: '',
      tags: [],
      owner_id: 'user-123',
      created_at: new Date(),
      updated_at: new Date()
    });

    const request = new Request('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Report' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('Test Report');
    expect(prismaMock.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test Report',
        owner_id: 'user-123'
      })
    });
  });

  it('returns 401 if not authenticated', async () => {
    jest.spyOn(require('next-auth'), 'getServerSession').mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Report' })
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
```

---

## 10. Appendix

### 10.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String?
  image           String?
  created_at      DateTime @default(now())
  last_logged_in  DateTime @default(now())

  reports         Report[]

  @@map("users")
}

model MagicLinkToken {
  id         String   @id @default(uuid())
  email      String
  token      String   @unique
  expires_at DateTime
  used       Boolean  @default(false)
  created_at DateTime @default(now())

  @@index([email])
  @@index([token])
  @@map("magic_link_tokens")
}

model Report {
  id              String   @id @default(uuid())
  name            String
  content         String   @default("")
  tags            String[] @default([])
  document_count  Int      @default(0)
  owner_id        String
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  last_opened_at  DateTime @default(now())

  owner           User       @relation(fields: [owner_id], references: [id], onDelete: Cascade)
  documents       Document[]

  @@index([owner_id])
  @@index([updated_at])
  @@map("reports")
}

model Document {
  id              String   @id @default(uuid())
  report_id       String
  filename        String
  file_type       String
  size            Int
  hash            String
  tags            String[] @default([])
  notes           String   @default("")
  status          String   @default("parsing") // 'parsing', 'ready', 'parse_failed'
  original_url    String
  parsed_url      String?
  parsed_content  String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  report          Report   @relation(fields: [report_id], references: [id], onDelete: Cascade)

  @@index([report_id])
  @@index([hash])
  @@map("documents")
}
```

### 10.2 Environment Variables Reference

```bash
# Database
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/researchhub_dev

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# OAuth Providers
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
LINKEDIN_CLIENT_ID=86abc...
LINKEDIN_CLIENT_SECRET=abc123...

# Email (Magic Links)
RESEND_API_KEY=re_abc123...

# File Parsing
LLAMA_CLOUD_API_KEY=llx-abc123...

# File Storage
STORAGE_PATH=./storage

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_abc123...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

**END OF API DESIGN SPECIFICATION**
