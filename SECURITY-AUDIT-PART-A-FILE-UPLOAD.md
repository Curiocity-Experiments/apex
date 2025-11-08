# Security Audit Report - PART A: File Upload Security

**Report Date:** November 8, 2025  
**Project:** Apex - Research Document Management Platform  
**Status:** ⚠️ CRITICAL - Immediate Action Required

---

## Executive Summary

The file upload system has **3 CRITICAL security vulnerabilities** that expose the application to:

- **Cross-user data access** (any authenticated user can access/delete any document)
- **Path traversal attacks** (files written outside intended directory)
- **Executable file uploads** (missing server-side MIME validation)

**Issues Found:**

- 🔴 CRITICAL: 3
- 🟠 HIGH: 4
- 🟡 MEDIUM: 2

---

## 1. Upload Validation Summary

### ✅ Client-Side Validation (Good Implementation)

**File:** `components/documents/DocumentUpload.tsx` (lines 26-51)

**What's Working:**

- ✅ File extension whitelist: `.txt`, `.md` only
- ✅ File size limit: 10MB enforced
- ✅ Clear error messages to users
- ✅ File input reset after upload

```typescript
// Extension validation
const validExtensions = ['.txt', '.md'];
const fileExtension = file.name
  .substring(file.name.lastIndexOf('.'))
  .toLowerCase();
if (!validExtensions.includes(fileExtension)) {
  setError('Only .txt and .md files are supported');
  return;
}

// Size limit
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  setError('File size must be less than 10MB');
  return;
}
```

### ❌ Server-Side Validation (Critical Gaps)

**File:** `app/api/documents/route.ts` (lines 32-78)

**Missing Controls:**

1. ❌ **NO MIME type validation** on server
2. ❌ **NO file size validation** on server (client-side only, easily bypassed)
3. ❌ **NO filename sanitization** or validation
4. ❌ **NO magic byte verification** (actual file content check)
5. ⚠️ **NO extension re-validation** against server whitelist

**Vulnerable Code:**

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const reportId = formData.get('reportId') as string;

  if (!file || !reportId) {
    return NextResponse.json(
      { error: 'File and reportId are required' },
      { status: 400 },
    );
  }

  // ❌ NO VALIDATION OF:
  // - file.type (MIME type)
  // - file.size (server-side)
  // - file.name (sanitization, length, etc)
  // Server accepts ANY file from ANY user for ANY report

  const documentService = new DocumentService(...);
  const document = await documentService.uploadDocument(
    reportId,
    file,
    file.name,  // ❌ User input passed directly
  );

  return NextResponse.json(document, { status: 201 });
}
```

---

## 2. 🔴 CRITICAL VULNERABILITY #1: Cross-User Data Access

### Authorization Missing from Document API

**Files Affected:**

- `app/api/documents/[id]/route.ts` (GET endpoint, lines 27-62)
- `app/api/documents/[id]/route.ts` (DELETE endpoint, lines 72-107)

**The Problem:**

The GET and DELETE endpoints do **NOT verify document ownership**. Any authenticated user can:

- Read any document from any report
- Delete any document from any report

**Vulnerable Code (GET):**

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ❌ MISSING: Verify this user owns the document
  // ❌ MISSING: Verify this user owns the report

  const documentService = new DocumentService(...);
  const document = await documentService.getDocument(params.id);

  return NextResponse.json(document, { status: 200 });
}
```

**Attack Scenario:**

```
User A creates: Report "Q4 Finances", Document "earnings.txt"
User A's document ID: doc-abc-123

User B (different, but authenticated):
  GET /api/documents/doc-abc-123 → Returns User A's document!
  DELETE /api/documents/doc-abc-123 → Deletes User A's document!
```

**Root Cause:**

Comparison with working authorization in Reports API:

```typescript
// ✅ REPORTS API: Does verify ownership
async getReport(id: string, userId: string): Promise<Report> {
  const report = await this.reportRepository.findById(id);
  if (!report) throw new Error('Report not found');
  if (report.userId !== userId) {  // ✅ Checks ownership
    throw new Error('Unauthorized');
  }
  return report;
}

// ❌ DOCUMENTS API: Missing ownership check
async getDocument(id: string): Promise<Document> {
  const document = await this.documentRepository.findById(id);
  if (!document) throw new Error('Document not found');
  // ❌ NO OWNERSHIP CHECK
  return document;
}
```

**CVSS Score:** 7.5 (High)

---

## 3. 🔴 CRITICAL VULNERABILITY #2: Path Traversal in File Storage

### Unsanitized reportId Parameter

**File:** `services/FileStorageService.ts` (line 36)

**The Problem:**

The `reportId` parameter is **not validated** before being used in file paths.

```typescript
async saveFile(
  reportId: string,      // ⚠️ NOT VALIDATED
  fileHash: string,
  file: File | Buffer,
  filename: string,
): Promise<string> {
  // VULNERABLE: reportId is used directly in path.join()
  const dir = path.join(this.basePath, reportId);
  await fs.mkdir(dir, { recursive: true });

  const ext = path.extname(filename);
  const storagePath = path.join(dir, `${fileHash}${ext}`);

  await fs.writeFile(storagePath, buffer);
  return storagePath;
}
```

**Attack Scenario:**

```
Attacker sends:
  reportId: "../../../etc/"
  filename: "passwd"
  content: [malicious content]

Result:
  basePath = "./storage"
  dir = path.join("./storage", "../../../etc/")
  WRITES TO: /etc/passwd (or similar)
```

**What an Attacker Could Do:**

1. Write executable scripts to system directories
2. Overwrite application configuration files
3. Poison data for other users
4. Achieve Remote Code Execution (if combined with other vulnerabilities)

**CVSS Score:** 6.5 (Medium-High)

---

## 4. 🔴 CRITICAL VULNERABILITY #3: No Server-Side MIME Type Validation

### Can Upload Executable Files if Client-Side Bypassed

**File:** `app/api/documents/route.ts`

**The Problem:**

Server accepts ANY file type. If client-side validation is bypassed, dangerous files can be uploaded.

**Vulnerable Code:**

```typescript
const formData = await request.formData();
const file = formData.get('file') as File;

// ❌ No check of file.type
// ❌ No validation of file extension
// ❌ No magic byte verification

await documentService.uploadDocument(reportId, file, file.name);
```

**Attack Scenarios:**

1. **Bypass client-side validation:**

   ```javascript
   // Browser console - modify request before sending
   const maliciousFile = new File(
     [executable_code],
     'readme.txt', // Fake extension
     { type: 'text/plain' }, // Fake MIME type
   );
   // Server accepts it as-is
   ```

2. **If storage directory exposed via web server:**
   - Attacker accesses: `http://apex.com/storage/report-123/abcd1234.exe`
   - File executed by browser or server

3. **Polyglot files:**
   - Create file that's valid PDF + valid PHP: `file.pdf.php`
   - Server might execute as PHP depending on configuration

**CVSS Score:** 6.0 (Medium)

---

## 5. Storage Security Assessment

### Storage Location

**File:** `services/FileStorageService.ts` (lines 14-58)

**Current Structure:**

```
storage/
  reportId/
    fileHash.ext
```

**Strengths:**

- ✅ Stored outside web root by default
- ✅ SHA-256 hash prevents direct name-based access
- ✅ Organized by report

**Weaknesses:**

- ❌ reportId not validated (path traversal vulnerability)
- ❌ Original filename stored in database (XSS risk)
- ❌ No encryption at rest
- ❌ If storage directory accidentally exposed, all files accessible

### File Access Control

**Issue:** No access control on stored files

```typescript
// getFile() method - no authorization check
async getFile(storagePath: string): Promise<Buffer> {
  return await fs.readFile(storagePath);  // ❌ No auth
}
```

---

## 6. 🟠 HIGH PRIORITY: Filename Security Issues

### 6.1 No Filename Sanitization

**File:** `services/FileStorageService.ts`

**Risks:**

1. **Stored XSS via filename**

   ```
   Filename uploaded: <script>alert('xss')</script>.txt
   Stored in DB as-is
   If displayed without HTML escaping: Script executes
   ```

2. **Directory traversal in filename**

   ```
   Filename: "../../etc/passwd.txt"
   Could break out of intended directory
   ```

3. **Special characters**
   ```
   Filename: "test?file.txt" (invalid on Windows)
   Filename: "test\0file.txt" (null byte truncation)
   ```

### 6.2 No Filename Length Validation

Test shows 204-character filename accepted (test line 497):

```typescript
const filename = 'a'.repeat(200) + '.txt'; // 204 chars
```

**Risks:**

- Exceeds file system limits (255 bytes max)
- Exceeds Windows path limits (260 characters)
- Causes display/UI issues

### 6.3 Original Filename Stored in Database

**File:** `services/DocumentService.ts` (line 74)

```typescript
const document: Document = {
  id: crypto.randomUUID(),
  reportId,
  filename, // ❌ User-supplied, unsanitized
  fileHash,
  storagePath,
  // ...
};
```

If displayed in UI without escaping = XSS vulnerability

---

## 7. 🟠 HIGH PRIORITY: File Size & DoS

### No Server-Side Size Limit

**Vulnerability:**

Client-side 10MB limit not enforced on server.

**Attack:**

```
1. Attacker uploads 50GB file
2. Server tries to load into memory
3. OutOfMemory exception
4. Service unavailable (DoS)
```

**Issue:** Even with Node.js request limits, not explicitly validated

### Concurrent Upload DoS

No rate limiting on `/api/documents` endpoint.

**Attack:**

```
1. Send 1000 concurrent file uploads
2. Exhaust disk space / memory / DB connections
3. Service becomes unavailable
```

---

## 8. 🟠 HIGH PRIORITY: No MIME Type Validation

### Server Accepts Any File Type

**Missing Validation:**

```typescript
// No check of MIME type
const file = formData.get('file') as File;

// These would all be accepted:
// - application/x-sh (shell script)
// - application/x-executable (ELF executable)
// - application/x-msdownload (Windows executable)
// - application/x-php (PHP script)
```

### No Magic Byte Verification

Real file type determined by content, not extension:

```
PDF: %PDF
ZIP: PK\x03\x04
EXE: MZ\x90\x00
ELF: \x7fELF
```

None of these are checked.

---

## 9. Vulnerability Summary Table

| ID  | Severity    | Issue                                          | Location                            | CVSS |
| --- | ----------- | ---------------------------------------------- | ----------------------------------- | ---- |
| 1   | 🔴 CRITICAL | Cross-user data access (no auth on GET/DELETE) | `app/api/documents/[id]/route.ts`   | 7.5  |
| 2   | 🔴 CRITICAL | Path traversal in reportId                     | `services/FileStorageService.ts:36` | 6.5  |
| 3   | 🔴 CRITICAL | No server-side MIME validation                 | `app/api/documents/route.ts`        | 6.0  |
| 4   | 🟠 HIGH     | No filename sanitization                       | `services/FileStorageService.ts`    | 5.5  |
| 5   | 🟠 HIGH     | No server-side file size limit                 | `app/api/documents/route.ts`        | 5.3  |
| 6   | 🟠 HIGH     | Stored XSS via filename display                | Components                          | 5.2  |
| 7   | 🟠 HIGH     | No rate limiting on uploads                    | `app/api/documents/route.ts`        | 4.5  |
| 8   | 🟡 MEDIUM   | No filename length validation                  | `services/FileStorageService.ts`    | 2.5  |

---

## 10. Recommended Fixes

### FIX #1: Add Document Authorization (CRITICAL)

Update `services/DocumentService.ts`:

```typescript
// Modify getDocument to check ownership
async getDocument(id: string, userId: string): Promise<Document> {
  const document = await this.documentRepository.findById(id);

  if (!document) {
    throw new Error('Document not found');
  }

  // Verify user owns the report
  const report = await this.reportRepository.findById(document.reportId);

  if (!report || report.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return document;
}

// Same for deleteDocument
async deleteDocument(id: string, userId: string): Promise<void> {
  const document = await this.getDocument(id, userId);
  await this.storageService.deleteFile(document.storagePath);
  await this.documentRepository.delete(id);
}
```

Update `app/api/documents/[id]/route.ts`:

```typescript
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documentService = new DocumentService(...);

  try {
    // Pass userId for authorization
    const document = await documentService.getDocument(
      params.id,
      session.user.id
    );
    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (error.message === 'Document not found') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
    }
    throw error;
  }
}
```

### FIX #2: Prevent Path Traversal (CRITICAL)

Update `services/FileStorageService.ts`:

```typescript
private validateReportId(reportId: string): void {
  // Only allow safe characters
  const validPattern = /^[a-zA-Z0-9\-_]+$/;

  if (!validPattern.test(reportId)) {
    throw new Error('Invalid report ID format');
  }

  if (reportId.includes('..') || reportId.includes('/') || reportId.includes('\\')) {
    throw new Error('Invalid report ID');
  }

  if (reportId.length > 100) {
    throw new Error('Report ID too long');
  }
}

async saveFile(
  reportId: string,
  fileHash: string,
  file: File | Buffer,
  filename: string,
): Promise<string> {
  // Validate reportId before using in path
  this.validateReportId(reportId);

  const dir = path.join(this.basePath, reportId);
  // ... rest of method
}
```

### FIX #3: Add Server-Side File Validation (CRITICAL)

Update `app/api/documents/route.ts`:

```typescript
function validateFile(file: File): void {
  // 1. Validate MIME type
  const ALLOWED_MIME = ['text/plain', 'text/markdown', 'text/x-markdown'];
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  // 2. Validate file size (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // 3. Validate extension
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!['.txt', '.md'].includes(ext)) {
    throw new Error('Only .txt and .md files allowed');
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const reportId = formData.get('reportId') as string;

  if (!file || !reportId) {
    return NextResponse.json(
      { error: 'File and reportId are required' },
      { status: 400 },
    );
  }

  // Add server-side validation
  try {
    validateFile(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid file' },
      { status: 400 },
    );
  }

  const documentService = new DocumentService(...);
  try {
    const document = await documentService.uploadDocument(
      reportId,
      file,
      file.name,
    );
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    // ... error handling
  }
}
```

### FIX #4: Sanitize Filenames (HIGH)

Add to `services/FileStorageService.ts`:

```typescript
private sanitizeFilename(filename: string): string {
  // Remove path traversal
  let sanitized = filename
    .replace(/\.\./g, '')
    .replace(/[\\\/]/g, '')
    .replace(/\0/g, '');

  // Remove special characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._\-]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 200) + '_' + Date.now();
  }

  return sanitized;
}
```

### FIX #5: HTML-Escape Filenames (HIGH)

In components displaying filenames:

```typescript
// Install: npm install dompurify
import DOMPurify from 'dompurify';

<span title={DOMPurify.sanitize(document.filename)}>
  {DOMPurify.sanitize(document.filename)}
</span>
```

---

## 11. Testing to Add

**File:** `__tests__/app/api/documents/route.test.ts`

```typescript
describe('File Upload Security', () => {
  describe('Authorization', () => {
    it('should prevent cross-user document access', async () => {
      // Create document as user1
      // Try to access as user2
      // Should return 403 Forbidden
    });

    it('should prevent cross-user document deletion', async () => {
      // Create document as user1
      // Try to delete as user2
      // Should return 403 Forbidden
    });
  });

  describe('File Validation', () => {
    it('should reject executable MIME types', async () => {
      const file = new File(['#!/bin/bash'], 'script.sh', {
        type: 'application/x-sh',
      });
      const response = await POST(createRequest(file));
      expect(response.status).toBe(400);
    });

    it('should reject files exceeding size limit on server', async () => {
      const file = new File([new Uint8Array(11 * 1024 * 1024)], 'large.txt');
      const response = await POST(createRequest(file));
      expect(response.status).toBe(400);
    });

    it('should reject path traversal in reportId', async () => {
      // reportId = "../../../etc/"
      // Should reject or sanitize
    });
  });
});
```

---

## 12. Implementation Priority

| Priority | Fix                         | Time | Deadline      |
| -------- | --------------------------- | ---- | ------------- |
| 1        | Document authorization      | 2h   | **IMMEDIATE** |
| 2        | Path traversal protection   | 1h   | **IMMEDIATE** |
| 3        | Server-side file validation | 2h   | **This Week** |
| 4        | Filename sanitization       | 1.5h | This Week     |
| 5        | Filename display escaping   | 1h   | This Week     |

---

## Conclusion

**Status:** 🔴 **CRITICAL** - Do not use in production until fixed

The file upload system has 3 critical vulnerabilities that must be addressed immediately:

1. Any authenticated user can access/delete any document
2. Files can be written outside storage directory
3. Executable files can be uploaded if validation bypassed

All fixes are straightforward and can be implemented in 1-2 days.
