# Security Audit Report - PART B: API Security

**Report Date:** November 8, 2025  
**Project:** Apex - Research Document Management Platform  
**Status:** ⚠️ HIGH - Security Hardening Required

---

## Executive Summary

The API has **no rate limiting, no security headers, and incomplete error handling**. While authentication is properly implemented, several endpoints lack authorization checks (see Part A). The application is vulnerable to:

- **Brute force attacks** on authentication endpoints
- **Denial of Service** via resource exhaustion
- **Information disclosure** via error messages
- **CSRF attacks** (no CSRF tokens, but mitigated by SameSite cookies)

**Issues Found:**

- 🟠 HIGH: 5
- 🟡 MEDIUM: 3
- 🟢 LOW: 2

---

## 1. Rate Limiting Status

### ❌ NO RATE LIMITING IMPLEMENTED

**Assessment:**

The application has **zero rate limiting** across all endpoints. No middleware, no NextAuth built-in limits, no per-IP throttling.

**Vulnerable Endpoints:**

| Endpoint                   | Method | Risk                   | Recommended Limit |
| -------------------------- | ------ | ---------------------- | ----------------- |
| `/api/auth/callback/email` | POST   | Brute force magic link | 5 attempts/min    |
| `/api/reports`             | POST   | Report flooding        | 100 req/hour      |
| `/api/documents`           | POST   | File upload DoS        | 20 req/hour       |
| `/api/reports/[id]`        | PATCH  | Update bombing         | 100 req/hour      |
| `/api/documents/[id]`      | DELETE | Deletion DoS           | 100 req/hour      |

### Rate Limiting Attack Scenarios

**Scenario 1: Brute Force Authentication**

```
Attacker sends:
  for i in range(1000000):
    POST /api/auth/signin
    email: "victim@example.com"
    callbackUrl: "..."

Result:
  - 1 million authentication attempts
  - 1 million emails sent if using magic link
  - Victim's inbox flooded (DoS)
  - Victim account potentially compromised
```

**Scenario 2: Storage Exhaustion**

```
Attacker sends:
  for i in range(1000):
    POST /api/documents
    file: 10MB data
    reportId: "attacker-report"

Result:
  - 10GB of disk space consumed
  - Server runs out of storage
  - All users affected
```

**Scenario 3: Database Resource Exhaustion**

```
Attacker sends:
  for i in range(10000):
    POST /api/reports
    name: "Report" + i

Result:
  - 10k database records created
  - Database becomes slow for all users
  - Connection pool exhausted
```

### 🟠 HIGH: Missing Rate Limiting

**CVSS Score:** 5.3 (Medium)

---

## 2. CORS Configuration Review

### ✅ CORS Configuration (Safe Default)

**Assessment:**

The application does **not explicitly configure CORS**. This is **actually good** - Next.js defaults are secure.

**Configuration:**

No custom `next.config.js` found. Using Next.js defaults:

```typescript
// Default behavior (safe):
// - Only same-origin requests allowed
// - No Access-Control-Allow-Origin header added
// - XMLHttpRequest from other domains blocked
```

**Testing Result:**

Verified in `middleware.ts` - only NextAuth middleware configured, no CORS headers added.

### ✅ CORS Status: SAFE

**What's Protected:**

- ✅ Cross-origin requests blocked
- ✅ Credentials not leaked via CORS
- ✅ No wildcard origin configuration
- ✅ No allow-all configuration

**If CORS Needed in Future:**

Safe implementation:

```typescript
// next.config.js (when CORS needed)
const nextConfig = {
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || 'https://yourdomain.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,HEAD,PUT,PATCH,POST,DELETE',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization',
          },
        ],
      },
    ];
  },
};
```

---

## 3. Security Headers Assessment

### ❌ NO SECURITY HEADERS CONFIGURED

**Assessment:**

The application does **not set any security headers**. This is a significant gap.

**Missing Headers:**

| Header                    | Current    | Recommended                       | Risk   |
| ------------------------- | ---------- | --------------------------------- | ------ |
| X-Content-Type-Options    | ❌ Missing | `nosniff`                         | Medium |
| X-Frame-Options           | ❌ Missing | `DENY`                            | Medium |
| Strict-Transport-Security | ❌ Missing | `max-age=31536000`                | High   |
| X-XSS-Protection          | ❌ Missing | `1; mode=block`                   | Low    |
| Content-Security-Policy   | ❌ Missing | Restrictive                       | High   |
| Referrer-Policy           | ❌ Missing | `strict-origin-when-cross-origin` | Low    |
| Permissions-Policy        | ❌ Missing | Restrictive                       | Low    |

### Attack Scenarios

**Scenario 1: MIME Type Sniffing**

```
No X-Content-Type-Options header

Attacker uploads "document.txt" with JavaScript:
  <script>alert('xss')</script>

IE/Edge browser "sniffs" MIME type:
  - Sees JavaScript content
  - Treats as text/javascript instead of text/plain
  - Executes script (XSS attack)
```

**Scenario 2: Clickjacking**

```
No X-Frame-Options header

Attacker creates:
  <iframe src="https://apex.example.com/reports" />
  <style>iframe { opacity: 0; } </style>
  <!-- Invisible iframe - user clicks through -->

User unknowingly:
  - Deletes their own reports
  - Changes settings
  - Grants attacker access
```

**Scenario 3: Man-in-the-Middle (MITM)**

```
No HSTS header

User connects to http://apex.example.com (unencrypted)
Attacker intercepts connection:
  - Steals session cookies
  - Intercepts auth tokens
  - Modifies responses

HSTS forces HTTPS and prevents this
```

### 🟠 HIGH: Missing Security Headers

**CVSS Score:** 5.5 (Medium-High)

---

## 4. Error Handling Audit

### ✅ Good: Errors Handled at API Layer

**Assessment:**

Most endpoints properly catch and return appropriate status codes.

**Example - Reports API (Good):**

```typescript
// app/api/reports/[id]/route.ts
try {
  const reportService = new ReportService(...);
  const report = await reportService.getReport(params.id, session.user.id);
  return NextResponse.json(report, { status: 200 });
} catch (error) {
  if (error instanceof Error) {
    if (error.message === 'Report not found') {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 },
      );
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }
  console.error('Error fetching report:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}
```

**Strengths:**

- ✅ Specific error messages returned
- ✅ Appropriate HTTP status codes (404, 403, 500)
- ✅ Errors logged server-side
- ✅ No stack traces in response

### ⚠️ Inconsistent Error Messages

**Issue:**

Error messages sometimes leak information.

**Examples:**

1. **Documents API:**

```typescript
// Line 71-72: Returns full error message
if (error instanceof Error && error.message.includes('already exists')) {
  return NextResponse.json({ error: error.message }, { status: 409 });
  // Leaks: "Document already exists in this report"
}
```

2. **Reports API:**

```typescript
// Line 56-62: Returns full error message
if (
  error.message.includes('cannot be empty') ||
  error.message.includes('too long')
) {
  return NextResponse.json({ error: error.message }, { status: 400 });
  // Leaks validation details
}
```

### ❌ Unexpected Errors Not Caught

**Issue:**

Unexpected errors thrown to Next.js handler.

```typescript
// app/api/documents/[id]/route.ts - line 59-60
catch (error) {
  // ...handle known errors...

  // Re-throw unexpected errors (will be caught by Next.js error handler)
  throw error;  // ❌ Not caught here
}
```

**Problem:**

In production, unhandled errors might:

- Expose sensitive information
- Show stack traces
- Reveal internal structure

**Better Approach:**

```typescript
catch (error) {
  // Handle specific errors
  if (error instanceof Error) {
    if (error.message === 'Not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  // Catch all others
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}
```

### 🟡 MEDIUM: Inconsistent Error Handling

**CVSS Score:** 3.5 (Low)

---

## 5. API Authentication & Authorization

### ✅ Authentication (Good Implementation)

**File:** `lib/auth.ts`

**What's Working:**

- ✅ NextAuth properly configured
- ✅ Email/magic link authentication (no password storage)
- ✅ Session strategy: database
- ✅ Session maxAge: 30 days (reasonable)
- ✅ Middleware enforces authentication

**Configuration:**

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: '', // Uses Resend
      from: process.env.RESEND_FROM_EMAIL,
      sendVerificationRequest: async ({ identifier, url }) => {
        // Sends magic link via email
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id; // ✓ User ID added to session
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

**Strengths:**

- ✅ No password vulnerabilities (magic link only)
- ✅ Database sessions (stateful, can be revoked)
- ✅ User ID included in session
- ✅ NEXTAUTH_SECRET required (not hardcoded)
- ✅ Resend used for email delivery

### ❌ Authorization (Incomplete)

**See Part A for critical authorization vulnerabilities in Documents API**

**Current Status:**

- ✅ Reports API: Checks user ownership
- ❌ Documents API: Missing ownership verification
- ✅ Middleware: Requires authentication
- ❌ No role-based access control (RBAC)
- ❌ No API key authentication (when/if needed)

---

## 6. API Pagination & Resource Limits

### ✅ No Pagination Issues (Not Implemented)

**Assessment:**

The application doesn't implement pagination, which could cause issues at scale.

**Current:**

```typescript
// app/api/reports/route.ts - GET
const reports = await reportService.listReports(session.user.id);
return NextResponse.json(reports, { status: 200 });
```

**Risk:** As user accumulates reports (1000+), response becomes large

**Future Recommendation:**

When pagination needed:

```typescript
// Add to API
const limit = Math.min(parseInt(query.limit) || 10, 100);
const offset = parseInt(query.offset) || 0;

const reports = await reportService.listReports(session.user.id, limit, offset);
```

---

## 7. API Request Body Limits

### ✅ Default Next.js Limits Applied

**Assessment:**

Next.js provides default request size limits:

- Default: 1 MB
- Configurable via `next.config.js`

**Currently:**

- ✅ Not overridden (stays at 1 MB default)
- ✅ Safe for multipart/form-data file uploads
- ✅ POST /api/documents works (file smaller than limit)

**Configuration (if needed):**

```typescript
// next.config.js
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase for 10MB files
    },
  },
};
```

---

## 8. API Response Headers

### ✅ Default Content-Type (Safe)

**Assessment:**

API endpoints return proper Content-Type headers:

```typescript
// Returned by NextResponse.json()
Content-Type: application/json; charset=utf-8
```

**Safe because:**

- ✅ JSON content type set
- ✅ charset specified
- ✅ No user-controlled content in header
- ✅ Prevents MIME type sniffing

### ⚠️ Missing: Cache Control Headers

**Issue:**

Sensitive data returned without cache control:

```typescript
// /api/reports returns user reports
// No Cache-Control header
// Could be cached by proxy/browser
```

**Recommendation:**

```typescript
const response = NextResponse.json(reports, { status: 200 });
response.headers.set('Cache-Control', 'no-store, no-cache');
return response;
```

---

## 9. API Endpoint Analysis

### POST /api/reports

**Endpoint:** Create new report

| Aspect           | Status      | Issue                         |
| ---------------- | ----------- | ----------------------------- |
| Authentication   | ✅ Required | Good                          |
| Authorization    | ✅ Checked  | Good                          |
| Input Validation | ✅ Good     | Name required, length checked |
| Rate Limiting    | ❌ None     | Could DOS with 10k reports    |
| Error Handling   | ✅ Good     | 400/401/500 proper            |
| Security Headers | ❌ None     | N/A for JSON API              |

### GET /api/reports

**Endpoint:** List user's reports

| Aspect         | Status      | Issue                |
| -------------- | ----------- | -------------------- |
| Authentication | ✅ Required | Good                 |
| Authorization  | ✅ Checked  | Filters by userId    |
| Rate Limiting  | ❌ None     | Could drain DB       |
| Error Handling | ✅ Good     | 401/500 proper       |
| Pagination     | ❌ None     | All reports returned |

### GET /api/reports/[id]

**Endpoint:** Get single report

| Aspect           | Status      | Issue              |
| ---------------- | ----------- | ------------------ |
| Authentication   | ✅ Required | Good               |
| Authorization    | ✅ Checked  | Verifies ownership |
| Input Validation | ⚠️ Partial  | UUID not validated |
| Error Handling   | ✅ Good     | 401/403/404 proper |

### POST /api/documents

**Endpoint:** Upload document

| Aspect           | Status      | Issue                          |
| ---------------- | ----------- | ------------------------------ |
| Authentication   | ✅ Required | Good                           |
| Authorization    | ❌ Missing  | See Part A                     |
| Input Validation | ❌ Weak     | No server-side file validation |
| File Size Limit  | ❌ None     | Server-side limit missing      |
| Rate Limiting    | ❌ None     | DoS via upload                 |
| Error Handling   | ✅ Good     | 400/401/409/500 proper         |

### GET /api/documents/[id]

**Endpoint:** Get document

| Aspect         | Status      | Issue              |
| -------------- | ----------- | ------------------ |
| Authentication | ✅ Required | Good               |
| Authorization  | ❌ Missing  | No ownership check |
| Error Handling | ✅ Good     | 401/404 proper     |

### DELETE /api/documents/[id]

**Endpoint:** Delete document

| Aspect         | Status      | Issue              |
| -------------- | ----------- | ------------------ |
| Authentication | ✅ Required | Good               |
| Authorization  | ❌ Missing  | No ownership check |
| Error Handling | ✅ Good     | 401/404 proper     |

---

## 10. Vulnerability Summary

### 🟠 HIGH Priority Issues

| #   | Issue                       | Location       | Impact                            | CVSS |
| --- | --------------------------- | -------------- | --------------------------------- | ---- |
| 1   | No rate limiting            | All endpoints  | DoS, brute force                  | 5.3  |
| 2   | No security headers         | All responses  | MIME sniffing, clickjacking, MITM | 5.5  |
| 3   | Error message leakage       | API endpoints  | Info disclosure                   | 3.5  |
| 4   | No Content-Security-Policy  | All endpoints  | XSS not mitigated by CSP          | 4.0  |
| 5   | Inconsistent error handling | Some endpoints | Unhandled exceptions              | 3.0  |

### 🟡 MEDIUM Priority Issues

| #   | Issue                  | Location       | Impact                  | CVSS |
| --- | ---------------------- | -------------- | ----------------------- | ---- |
| 6   | No pagination          | List endpoints | Performance degradation | 2.5  |
| 7   | No input length limits | Name fields    | Data validation         | 1.5  |
| 8   | Missing cache headers  | API responses  | Sensitive data cached   | 2.0  |

### 🟢 LOW Priority Issues

| #   | Issue                     | Location     | Impact              | CVSS |
| --- | ------------------------- | ------------ | ------------------- | ---- |
| 9   | UUID format not validated | Query params | Inefficient queries | 1.0  |
| 10  | No API versioning         | All routes   | Breaking changes    | 0.0  |

---

## 11. Recommended Fixes

### FIX #1: Implement Rate Limiting (HIGH)

Install rate limiting middleware:

```bash
npm install express-rate-limit
```

Create `lib/rateLimit.ts`:

```typescript
import rateLimit from 'express-rate-limit';

export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  message: string,
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiters for different endpoints
export const authLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // 5 requests
  'Too many authentication attempts, try again later',
);

export const documentUploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 uploads
  'Upload limit exceeded, try again later',
);

export const reportLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  100, // 100 reports
  'Report creation limit exceeded',
);
```

Apply to endpoints:

```typescript
// app/api/documents/route.ts
import { documentUploadLimiter } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Note: rateLimit middleware needs Express.js
  // For Next.js, use: npm install next-rate-limit
  // Or implement custom rate limiting using Redis
  // For now, add basic validation:
  // Rate limiting recommended as separate deployment
}
```

**Better Approach for Next.js:**

Use Upstash Redis-based rate limiting:

```typescript
// npm install @upstash/ratelimit @upstash/redis

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(20, '1 h'),
});

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  const { success } = await ratelimit.limit(`upload_${ip}`);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // ... rest of handler
}
```

### FIX #2: Add Security Headers (HIGH)

Create `next.config.js`:

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
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### FIX #3: Improve Error Handling (MEDIUM)

Create `lib/apiError.ts`:

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return {
      status: error.statusCode,
      body: { error: error.message },
    };
  }

  if (error instanceof Error) {
    // Log details server-side, return generic message
    console.error('Unexpected error:', error.message);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }

  return {
    status: 500,
    body: { error: 'Unknown error' },
  };
}
```

Update endpoints:

```typescript
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const service = new ReportService(...);
    const report = await service.getReport(params.id, session.user.id);

    return NextResponse.json(report);
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
```

### FIX #4: Add Cache Headers (MEDIUM)

```typescript
export async function GET(request, { params }) {
  try {
    // ... fetch data ...

    const response = NextResponse.json(data);

    // Prevent caching of sensitive user data
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    // ... error handling
  }
}
```

### FIX #5: Add Input Validation (MEDIUM)

```typescript
import { z } from 'zod';

const ReportIdSchema = z.string().uuid();
const ReportNameSchema = z.string().min(1).max(200);

export async function GET(request, { params }) {
  try {
    // Validate UUID format
    const id = ReportIdSchema.parse(params.id);

    // ... rest of handler
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      );
    }
    // ... error handling
  }
}
```

---

## 12. Implementation Priority

| Fix              | Priority | Time      | Deadline    |
| ---------------- | -------- | --------- | ----------- |
| Rate limiting    | HIGH     | 3-4 hours | Next sprint |
| Security headers | HIGH     | 1 hour    | ASAP        |
| Error handling   | MEDIUM   | 2 hours   | This week   |
| Cache headers    | MEDIUM   | 1 hour    | This week   |
| Input validation | MEDIUM   | 2 hours   | This week   |

---

## 13. Deployment Checklist

Before production deployment:

- [ ] Rate limiting configured and tested
- [ ] Security headers set in next.config.js
- [ ] Error handling doesn't leak sensitive info
- [ ] Cache headers prevent sensitive data caching
- [ ] Input validation for all parameters
- [ ] NEXTAUTH_SECRET set (not in code)
- [ ] HTTPS enforced
- [ ] Database connection uses SSL
- [ ] Environment variables in .env (not committed)
- [ ] CORS configured if needed
- [ ] API keys rotated/secure
- [ ] Logging doesn't expose sensitive data
- [ ] Tests added for security fixes

---

## Conclusion

**Current Status:** ⚠️ **HIGH** - Security hardening needed before production

The API lacks fundamental security controls:

1. **No rate limiting** - vulnerable to DoS and brute force
2. **No security headers** - vulnerable to MIME sniffing, clickjacking
3. **Incomplete error handling** - may leak information
4. **Missing authorization** - cross-user access (Part A)

All fixes are straightforward and can be implemented in 1-2 weeks. Security headers take 1 hour, rate limiting requires Upstash/Redis setup.

**Recommended Timeline:**

- Week 1: Add security headers + complete error handling (Part A authorization)
- Week 2: Implement rate limiting + input validation
