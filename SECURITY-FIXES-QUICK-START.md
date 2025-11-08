# Security Fixes - Quick Start Guide

**⏱️ Total Time:** ~6-7 hours for Phase 1 (critical fixes)

---

## Phase 1: Critical Fixes (MUST DO NOW)

### Fix #1: Document Authorization (2 hours)

**Step 1:** Update DocumentService

Edit: `services/DocumentService.ts`

Change method signature:

```typescript
// OLD
async getDocument(id: string): Promise<Document> {

// NEW
async getDocument(id: string, userId: string): Promise<Document> {
  const document = await this.documentRepository.findById(id);

  if (!document) {
    throw new Error('Document not found');
  }

  // NEW: Verify ownership
  const report = await this.reportRepository.findById(document.reportId);

  if (!report || report.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return document;
}
```

Also update deleteDocument:

```typescript
async deleteDocument(id: string, userId: string): Promise<void> {
  const document = await this.getDocument(id, userId);
  await this.storageService.deleteFile(document.storagePath);
  await this.documentRepository.delete(id);
}
```

**Step 2:** Update API endpoints

Edit: `app/api/documents/[id]/route.ts`

For GET:

```typescript
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documentService = new DocumentService(...);

  try {
    // Pass userId
    const document = await documentService.getDocument(
      params.id,
      session.user.id  // ← ADD THIS
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

For DELETE (similar):

```typescript
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documentService = new DocumentService(...);

  try {
    await documentService.deleteDocument(params.id, session.user.id);  // ← ADD userId
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // ... same error handling as GET
  }
}
```

**Test:**

```bash
npm test -- __tests__/app/api/documents/\[id\]/route.test.ts
```

---

### Fix #2: Path Traversal Protection (1 hour)

Edit: `services/FileStorageService.ts`

Add validation method:

```typescript
private validateReportId(reportId: string): void {
  // Only allow safe characters
  if (!/^[a-zA-Z0-9\-_]+$/.test(reportId)) {
    throw new Error('Invalid report ID format');
  }

  // No path traversal
  if (reportId.includes('..') || reportId.includes('/') || reportId.includes('\\')) {
    throw new Error('Invalid report ID');
  }

  // Length limit
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
  // ADD THIS LINE
  this.validateReportId(reportId);

  const dir = path.join(this.basePath, reportId);
  // ... rest unchanged
}
```

**Test with:**

```typescript
// Should throw error
fileStorageService.saveFile('../../../etc', hash, file, 'test.txt');
```

---

### Fix #3: Server-Side File Validation (2 hours)

Edit: `app/api/documents/route.ts`

Add at top of file:

```typescript
function validateFile(file: File): void {
  // Check MIME type
  const ALLOWED_MIME = ['text/plain', 'text/markdown', 'text/x-markdown'];
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  // Check size
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Check extension
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!['.txt', '.md'].includes(ext)) {
    throw new Error('Only .txt and .md files allowed');
  }
}
```

In POST handler, add after field validation:

```typescript
if (!file || !reportId) {
  return NextResponse.json(
    { error: 'File and reportId are required' },
    { status: 400 },
  );
}

// ADD THIS
try {
  validateFile(file);
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Invalid file' },
    { status: 400 },
  );
}

const documentService = new DocumentService(...);
// ... rest unchanged
```

**Test with:**

```bash
# Test invalid MIME
curl -F "file=@test.exe" -F "reportId=test" http://localhost:3000/api/documents

# Test large file
curl -F "file=@11gb.bin" -F "reportId=test" http://localhost:3000/api/documents

# Test invalid extension
curl -F "file=@test.php" -F "reportId=test" http://localhost:3000/api/documents
```

---

### Fix #4: Security Headers (1 hour)

Create `next.config.js` in project root:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Test:**

```bash
# Rebuild
npm run build

# Check headers (in Chrome DevTools Network tab)
curl -i http://localhost:3000/api/reports
```

---

## Phase 1 Testing Checklist

- [ ] Document authorization test passes
- [ ] GET /api/documents/[id] returns 403 for unauthorized user
- [ ] DELETE /api/documents/[id] returns 403 for unauthorized user
- [ ] Path traversal in reportId returns 400 error
- [ ] Invalid MIME type returns 400 error
- [ ] File over 10MB returns 400 error
- [ ] Invalid extension returns 400 error
- [ ] Security headers present in responses
- [ ] Existing tests still pass: `npm test`

---

## Quick Verification

After implementing Phase 1 fixes:

```bash
# Run tests
npm test

# Build for production
npm run build

# Check for errors
npm run lint

# Manual testing
npm run dev
# Then test in browser/curl
```

---

## Phase 2: Important Fixes (This Week)

- [ ] Implement rate limiting (3-4 hours)
- [ ] Sanitize filenames (1.5 hours)
- [ ] Improve error handling (2 hours)
- [ ] Add cache headers (1 hour)

See full reports for details.

---

## Support

If stuck on any fix:

1. Check detailed report: SECURITY-AUDIT-PART-A or PART-B
2. See code examples in respective sections
3. Check test files for expected behavior

---

## Timeline

| Fix               | Time   | Done? |
| ----------------- | ------ | ----- |
| Authorization     | 2h     | [ ]   |
| Path traversal    | 1h     | [ ]   |
| File validation   | 2h     | [ ]   |
| Security headers  | 1h     | [ ]   |
| **Total Phase 1** | **6h** | [ ]   |

After Phase 1 complete: ✅ Ready for staging deployment
After Phase 2 complete: ✅ Ready for production deployment
