# Apex Technical Decisions

**Date**: 2025-11-06
**Status**: Decision Document
**Purpose**: Answer all open questions from PRDs to enable technical specification

---

## Decision Framework

Each decision evaluated on:

- ⚡ **Development Speed**: Time to implement
- 💰 **Cost**: Infrastructure and service costs
- 🎯 **User Experience**: Impact on end-user
- 📈 **Scalability**: Future growth support
- 🔧 **Maintenance**: Long-term operational burden
- 🏗️ **Upgrade Path**: Ease of enhancing later

**Priority**: NOW phase prioritizes speed and simplicity, NEXT/LATER prioritize scale and UX.

---

# NOW PHASE DECISIONS

## 1. Database: SQLite vs PostgreSQL (Local Development)

### ✅ **DECISION: PostgreSQL (Docker Container)**

**Reasoning**:

- **Parity with Production**: NEXT phase uses PostgreSQL → seamless transition
- **Full-Text Search**: Built-in FTS capabilities (needed for NEXT)
- **JSON Support**: Better JSONB handling (for future rich text storage)
- **Developer Experience**: Same SQL dialect as production
- **Docker Setup**: Simple one-liner: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16`

**Rejected: SQLite**

- ❌ Transition required for NEXT phase (SQLite → PostgreSQL)
- ❌ Limited full-text search (FTS5 extension different from PostgreSQL)
- ❌ No JSONB type (would need TEXT + manual parsing)
- ✅ Pros: Zero setup, single file
- **Verdict**: Not worth transition complexity later

**Setup Command**:

```bash
docker run -d \
  --name apex-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=apex_dev \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

**Connection String**:

```
postgresql://postgres:devpassword@localhost:5432/apex_dev
```

---

## 2. Markdown Editor: Library Choice

### ✅ **DECISION: React SimpleMDE (react-simplemde-editor)**

**Reasoning**:

- **Simplicity**: Drop-in component, minimal configuration
- **Bundle Size**: ~50KB (lightweight)
- **Features**: Preview, toolbar, keyboard shortcuts
- **Upgrade Path**: Easy to swap for Tiptap in NEXT phase (content is plain markdown)
- **Developer Experience**: Clean API, well-documented

**Alternatives Considered**:

**React Markdown Editor** (rejected):

- ❌ Less popular (fewer GitHub stars)
- ❌ Limited documentation

**CodeMirror 6** (rejected):

- ❌ Heavy setup (need to configure markdown mode, toolbar, etc.)
- ✅ Powerful but overkill for MVP
- **Verdict**: Save for advanced use cases

**Monaco Editor** (rejected):

- ❌ Very large bundle (~2MB)
- ❌ Designed for code editing, not writing
- **Verdict**: Wrong tool for the job

**Setup**:

```bash
npm install react-simplemde-editor easymde
```

**Usage**:

```tsx
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

<SimpleMDE
  value={reportContent}
  onChange={setReportContent}
  options={{
    spellChecker: false,
    autosave: { enabled: true, delay: 30000 },
  }}
/>;
```

---

## 3. Email Service: Magic Link Authentication

### ✅ **DECISION: Resend.com**

**Reasoning**:

- **Developer Experience**: Best-in-class DX (simple API, great docs)
- **Free Tier**: 100 emails/day, 3,000/month (sufficient for NOW testing)
- **Reliability**: Built by ex-Postmark team (email delivery experts)
- **Setup Time**: < 10 minutes (vs. hours for SMTP configuration)
- **React Email**: Native integration for email templates
- **Cost**: Free for NOW, $20/month for 50,000 emails (NEXT)

**Alternatives Considered**:

**SendGrid** (rejected):

- ❌ Complex setup (domain verification, DKIM, SPF records)
- ❌ Steeper learning curve
- ✅ More features (but overkill for magic links)
- **Verdict**: Too much overhead for NOW

**AWS SES** (rejected):

- ❌ Requires AWS account setup
- ❌ Region-specific (need to move out of sandbox)
- ❌ Complex IAM permissions
- **Verdict**: Save for enterprise LATER phase

**Local SMTP (MailHog)** (rejected):

- ✅ Great for pure local testing
- ❌ Can't test real email delivery
- ❌ Extra Docker container to manage
- **Verdict**: Use Resend's test mode instead

**Setup**:

```bash
npm install resend
```

**Environment Variable**:

```
RESEND_API_KEY=re_... (from resend.com dashboard)
```

**Usage**:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Apex <noreply@apex.app>',
  to: userEmail,
  subject: 'Sign in to Apex',
  html: `<a href="${magicLink}">Click here to sign in</a>`,
});
```

---

## 4. OAuth Redirect URLs: Development Setup

### ✅ **DECISION: Use localhost URLs with separate dev OAuth apps**

**Reasoning**:

- **Security**: Production and dev OAuth apps isolated
- **Callback URLs**:
  - Dev: `http://localhost:3000/api/auth/callback/google`
  - Prod: `https://apex.app/api/auth/callback/google`
- **Best Practice**: Never mix dev and prod credentials

**Google OAuth Setup (Dev)**:

1. Go to Google Cloud Console
2. Create project: "Apex Dev"
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret → `.env.local`

**LinkedIn OAuth Setup (Dev)**:

1. Go to LinkedIn Developers
2. Create app: "Apex Dev"
3. Redirect URLs: `http://localhost:3000/api/auth/callback/linkedin`
4. Request scopes: `openid`, `profile`, `email`
5. Copy Client ID and Secret → `.env.local`

**Environment Variables**:

```env
# .env.local (NOT committed to git)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

---

## 5. LlamaParse Quota: Free Tier Sufficient?

### ✅ **DECISION: Yes, start with free tier (1,000 pages/day)**

**Reasoning**:

- **NOW Phase Usage**: 1-2 developers, < 50 documents/day
- **Free Tier**: 1,000 pages/day (enough for 50 x 20-page documents)
- **Paid Tier**: $0.003/page (500 pages = $1.50)
- **Upgrade Path**: If needed in NEXT, paid tier is cheap ($30/month for 10K pages)

**Monitoring**:

- Add usage logging to track pages processed
- Alert if approaching 80% of daily limit
- Implement queue if limit hit (process remaining tomorrow)

**Environment Variable**:

```env
LLAMA_CLOUD_API_KEY=llx-... (from cloud.llamaindex.ai)
```

**Usage Tracking**:

```typescript
// Log after each parse
console.log(
  `LlamaParse: Processed ${pageCount} pages (${totalToday}/1000 daily limit)`,
);
```

---

## 6. File Hash Algorithm: MD5 vs SHA-256

### ✅ **DECISION: SHA-256**

**Reasoning**:

- **Security**: SHA-256 cryptographically secure (MD5 has collisions)
- **Duplicate Detection**: Need collision resistance for accurate deduplication
- **Performance**: SHA-256 fast enough (< 100ms for 10MB file in Node.js)
- **Future-Proof**: Industry standard, won't need to change later
- **File Integrity**: Can verify file hasn't been corrupted

**Rejected: MD5**

- ❌ Collision vulnerabilities (two different files can have same hash)
- ✅ 2x faster than SHA-256
- **Verdict**: Speed gain not worth collision risk

**Implementation**:

```typescript
import crypto from 'crypto';
import fs from 'fs';

function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Usage
const fileHash = await calculateFileHash('/path/to/file.pdf');
// Returns: "a3d5c8f9e2b1..." (64 hex characters)
```

---

# NEXT PHASE DECISIONS

## 7. Cloud Database Provider

### ✅ **DECISION: Supabase (PostgreSQL + Storage + Auth)**

**Reasoning**:

- **All-in-One**: Database + file storage + authentication in one platform
- **PostgreSQL**: Fully managed PostgreSQL 15
- **Free Tier**: 500MB database, 1GB storage (enough for early users)
- **Pricing**: $25/month for 8GB database, 100GB storage (scales with users)
- **Developer Experience**: Excellent dashboard, real-time subscriptions, auto-generated APIs
- **Portability**: Standard PostgreSQL → easy to move elsewhere if needed
- **Storage Integration**: Native integration with Supabase Storage (simpler than R2)

**Alternatives Considered**:

**Neon** (rejected):

- ✅ Fastest PostgreSQL (serverless, auto-scaling)
- ✅ Free tier: 3GB storage
- ❌ No integrated file storage → need separate R2/S3
- ❌ No built-in auth
- **Verdict**: Great DB, but need to add more services

**PlanetScale** (rejected):

- ✅ MySQL-based, excellent scaling
- ❌ MySQL not PostgreSQL (different FTS, no JSONB)
- ❌ Would require changing NOW phase database choice
- ❌ More expensive ($39/month minimum)
- **Verdict**: Wrong database engine

**Comparison Table**:

| Feature      | Supabase            | Neon             | PlanetScale      |
| ------------ | ------------------- | ---------------- | ---------------- |
| Database     | PostgreSQL          | PostgreSQL       | MySQL            |
| Free Tier    | 500MB DB, 1GB files | 3GB DB           | 5GB DB           |
| File Storage | ✅ Built-in         | ❌ Need R2/S3    | ❌ Need R2/S3    |
| Auth         | ✅ Built-in         | ❌ Need NextAuth | ❌ Need NextAuth |
| Pricing      | $25/mo              | $19/mo           | $39/mo           |
| **Winner**   | ✅                  | -                | -                |

**Setup**:

1. Create project on supabase.com
2. Copy connection string → `DATABASE_URL` env var
3. Run database schema setup
4. Enable Supabase Storage
5. Configure bucket for file uploads

---

## 8. File Storage Provider

### ✅ **DECISION: Supabase Storage**

**Reasoning** (based on Supabase database choice):

- **Integration**: Seamless with Supabase database (same dashboard, same billing)
- **Row-Level Security**: File access controlled by database policies (powerful!)
- **Free Tier**: 1GB storage (enough for 100-200 PDF documents)
- **Pricing**: $0.021/GB/month storage, $0.09/GB egress (cheaper than S3)
- **CDN**: Built-in CDN for fast global access
- **Resumable Uploads**: TUS protocol for large files
- **Developer Experience**: Simple JavaScript SDK

**Rejected: Cloudflare R2**

- ✅ Zero egress fees (huge cost saving at scale)
- ✅ S3-compatible API
- ❌ Separate service to manage (more complexity)
- ❌ Separate billing
- ❌ No native integration with Supabase
- **Verdict**: Great for LATER phase if egress costs become issue

**Cost Comparison** (1000 users, 5 reports each, 20 PDFs per report = 100K PDFs @ 2MB avg = 200GB):

| Provider | Storage | Egress (10GB/mo) | Total/mo  |
| -------- | ------- | ---------------- | --------- |
| Supabase | $4.20   | $0.90            | **$5.10** |
| R2       | $3.00   | $0.00            | **$3.00** |
| S3       | $4.60   | $0.90            | **$5.50** |

**Winner for NOW/NEXT**: Supabase (simplicity > $2/month savings)
**Upgrade Path**: Move to R2 in LATER if egress costs exceed $50/month

**Setup**:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// Upload file
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${userId}/${reportId}/${documentId}.pdf`, file);

// Get public URL (signed)
const { data: signedUrl } = await supabase.storage
  .from('documents')
  .createSignedUrl(`${userId}/${reportId}/${documentId}.pdf`, 3600); // 1 hour
```

---

## 9. Monitoring Stack

### ✅ **DECISION: Sentry (Errors) + Vercel Analytics (Performance)**

**Reasoning**:

- **Sentry**: Best-in-class error tracking
  - Free tier: 5,000 errors/month (sufficient for NEXT)
  - Source maps for debugging minified code
  - Release tracking, user feedback
- **Vercel Analytics**: Built into Vercel platform
  - Free tier: 100K events/month
  - Real user monitoring (RUM)
  - Web Vitals tracking (Core Web Vitals)
- **Cost**: Free for NEXT phase, ~$26/month for 50K errors in LATER

**Rejected: Datadog / New Relic**

- ❌ Expensive ($15-100/month minimum)
- ❌ Overkill for NEXT phase (10-50 users)
- **Verdict**: Save for enterprise LATER phase if needed

**Setup**:

**Sentry** (`sentry.client.config.ts`):

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  environment: process.env.NODE_ENV,
});
```

**Vercel Analytics** (`app/layout.tsx`):

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 10. Pricing Model

### ✅ **DECISION: Free Tier + Paid Tier ($10/month)**

**Reasoning**:

- **Free Tier**: Attract users, validate product
  - Limits: 3 reports, 50 documents, 1GB storage
  - Enough for light users / evaluation
- **Paid Tier**: $10/month individual plan
  - Unlimited reports and documents
  - 10GB storage
  - Priority support
- **Revenue Goal**: 50 paid users = $500/month (covers infrastructure)

**Why Not Free-Only**:

- ❌ Infrastructure costs scale with users (database, storage, LlamaParse)
- ❌ No revenue = unsustainable
- ❌ Free users often less engaged

**Why Not Paid-Only**:

- ❌ Barrier to entry (no trial)
- ❌ Can't validate product-market fit without users

**Pricing Page** (later):
| Feature | Free | Pro ($10/mo) |
|---------|------|--------------|
| Reports | 3 | Unlimited |
| Documents | 50 | Unlimited |
| Storage | 1GB | 10GB |
| File Types | TXT, MD, PDF | All types |
| Search | Filename only | Full-text |
| Support | Community | Email |

---

# LATER PHASE DECISIONS

## 11. Collaboration Pricing

### ✅ **DECISION: Team Plan ($25/month, up to 5 users)**

**Reasoning**:

- **Free Tier**: Individual use only (no sharing)
- **Pro Tier**: $10/month individual (no collaboration)
- **Team Tier**: $25/month for up to 5 users ($5/user/month)
  - Shared reports, real-time co-editing, comments
  - 50GB shared storage
  - Team admin dashboard
- **Enterprise**: Custom pricing for 20+ users

**Why Not Free Collaboration**:

- ❌ Real-time sync infrastructure expensive (WebSocket servers, CRDT storage)
- ❌ Encourages abuse (create infinite shared reports)

**Competitive Pricing**:

- Notion: $10/user/month (team plan)
- Google Workspace: $6/user/month
- Dropbox: $15/user/month
- **Our Pricing**: $5/user/month (competitive)

---

## 12. Mobile App: PWA vs Native

### ✅ **DECISION: Progressive Web App (PWA)**

**Reasoning**:

- **PWA Advantages**:
  - ✅ Single codebase (web + mobile)
  - ✅ No app store approval (instant updates)
  - ✅ Install to home screen (iOS 16.4+, Android)
  - ✅ Offline support (Service Worker caching)
  - ✅ Push notifications (web push API)
- **Native Disadvantages**:
  - ❌ Need separate React Native codebase
  - ❌ App store fees ($99/year Apple, $25 one-time Google)
  - ❌ Slower iteration (app review process)
  - ❌ More maintenance (2 codebases)

**PWA Features**:

- Install prompt: "Add Apex to home screen"
- Offline mode: Cache last 5 viewed reports
- Push notifications: "John commented on your report"
- App-like experience: Full-screen, splash screen

**Upgrade Path**: If PWA insufficient, consider React Native or Capacitor (wraps PWA)

**Setup** (`next.config.js` + `next-pwa`):

```bash
npm install next-pwa
```

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // Next.js config
});
```

**Manifest** (`public/manifest.json`):

```json
{
  "name": "Apex",
  "short_name": "Apex",
  "description": "Research document management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4a9eff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 13. Transcription Provider

### ✅ **DECISION: OpenAI Whisper API**

**Reasoning**:

- **Accuracy**: Best-in-class transcription (98%+ accuracy)
- **Pricing**: $0.006/minute ($0.36 for 1-hour call)
- **Languages**: 99 languages (future-proof for international)
- **Speed**: ~30 seconds to transcribe 1-hour audio
- **API Simplicity**: Single endpoint, drop-in replacement

**Alternatives Considered**:

**AssemblyAI** (rejected):

- ✅ Similar accuracy
- ✅ Real-time transcription
- ❌ More expensive ($0.00025/second = $0.90/hour)
- ❌ More complex API
- **Verdict**: 2.5x more expensive

**Deepgram** (rejected):

- ✅ Fastest transcription (real-time)
- ✅ Cheapest ($0.0043/minute = $0.26/hour)
- ❌ Requires streaming setup (more complex)
- ❌ Lower accuracy for financial jargon
- **Verdict**: Save for real-time use cases

**Cost Example** (100 users, 5 hours audio/month each):

- **Whisper**: 500 hours × $0.36 = **$180/month**
- **AssemblyAI**: 500 hours × $0.90 = **$450/month**
- **Deepgram**: 500 hours × $0.26 = **$130/month**

**Decision**: Whisper (best balance of accuracy and cost)

**Usage**:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('earnings-call.mp3'),
  model: 'whisper-1',
  language: 'en', // Optional
  response_format: 'verbose_json', // Get timestamps
});

// transcription.text = "Thank you for joining today's call..."
// transcription.segments = [{ start: 0.0, end: 2.5, text: "Thank you..." }, ...]
```

---

## 14. Advanced Search Provider

### ✅ **DECISION: Self-Hosted Typesense**

**Reasoning**:

- **Typesense vs Alternatives**:
  - ✅ Open source (can self-host for $10/month DigitalOcean droplet)
  - ✅ Fast (< 50ms search for 1M documents)
  - ✅ Typo tolerance, faceting, geo-search
  - ✅ Simple deployment (single Docker container)
- **vs Managed Algolia**:
  - Algolia: $1/1000 searches ($100/month for 100K searches)
  - Typesense Cloud: $0.03/hour = $22/month (cheaper)
  - Self-hosted: $10/month droplet (cheapest)
- **Upgrade Path**: Start self-hosted, move to Typesense Cloud if scaling issues

**Rejected: Meilisearch**

- ✅ Similar to Typesense
- ❌ Slower indexing (batch updates)
- ❌ Less battle-tested
- **Verdict**: Typesense more mature

**Rejected: Algolia**

- ✅ Best-in-class search
- ✅ Managed service (zero ops)
- ❌ Expensive ($100+/month)
- **Verdict**: Save for enterprise tier

**Self-Hosted Setup** (DigitalOcean):

```bash
# Docker Compose
version: '3.8'
services:
  typesense:
    image: typesense/typesense:0.25.0
    ports:
      - "8108:8108"
    volumes:
      - ./typesense-data:/data
    command: '--data-dir /data --api-key=your-api-key --enable-cors'
```

**Indexing**:

```typescript
import Typesense from 'typesense';

const client = new Typesense.Client({
  nodes: [{ host: 'search.apex.app', port: '443', protocol: 'https' }],
  apiKey: process.env.TYPESENSE_API_KEY,
});

// Create collection (schema)
await client.collections().create({
  name: 'documents',
  fields: [
    { name: 'filename', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'tags', type: 'string[]' },
    { name: 'report_id', type: 'string', facet: true },
    { name: 'created_at', type: 'int64' },
  ],
});

// Index document
await client
  .collections('documents')
  .documents()
  .create({
    filename: 'Q3-earnings.pdf',
    content: 'Revenue grew 23% YoY...',
    tags: ['financial-data', 'q3-2024'],
    report_id: 'report-123',
    created_at: Date.now(),
  });

// Search with typo tolerance
const results = await client.collections('documents').documents().search({
  q: 'reveenue groth', // Typos
  query_by: 'filename,content',
  typo_tolerance: 2,
  filter_by: 'report_id:=report-123',
});
```

---

## 15. API Monetization

### ✅ **DECISION: Free API Access (Rate Limited)**

**Reasoning**:

- **LATER Phase Goals**: Drive adoption, enable integrations
- **Free Tier API**:
  - 100 requests/minute per user
  - 1,000 requests/hour per user
  - Same data access as web UI (no premium API features)
- **No Paid API Tier**: Keep simple for LATER phase
- **Upgrade Path**: Add paid tier if high-volume users request (e.g., $50/month for 10K requests/hour)

**Why Free**:

- ✅ Encourages integrations (Zapier, n8n, custom scripts)
- ✅ Competitive advantage (many tools don't offer API)
- ✅ Increases lock-in (users build workflows)
- ❌ Con: Potential abuse (mitigated by rate limiting)

**Rate Limiting** (using Upstash Redis):

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});

export async function GET(req: Request) {
  const userId = await getUserFromToken(req);
  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Continue with API logic...
}
```

---

## 16. Testing Methodology: TDD vs Test-After

### ✅ **DECISION: Strict Test-Driven Development (TDD)**

**Reasoning**:

- **Quality First**: Tests drive design, not validate it after
- **Refactoring Safety**: High coverage from day 1 enables fearless refactoring
- **Living Documentation**: Tests serve as executable specification
- **Bug Prevention**: Catch issues at write-time, not runtime
- **Clean Architecture**: TDD naturally enforces SOLID principles and loose coupling
- **Financial Data Platform**: High correctness requirements justify investment in quality

**Why TDD (Not Test-After)**:

- ✅ **Design Quality**: Forces thinking about interfaces before implementation
- ✅ **Coverage**: Achieves 90-100% coverage naturally (vs 30-50% typical)
- ✅ **Refactoring**: Can change code fearlessly with comprehensive safety net
- ✅ **Debugging Time**: 70% reduction (bugs caught at write-time)
- ✅ **Production Bugs**: 80% reduction (industry data)
- ✅ **Onboarding**: Tests document expected behavior for new developers

**Trade-offs**:

- ⏱️ **Initial Development**: ~30% slower upfront
- ✅ **Long-term Velocity**: 3x faster after initial build (easier to change)
- ✅ **Maintenance**: Dramatically lower cost (high test coverage)
- ✅ **Confidence**: Ship with certainty, not hope

**Rejected: Test-After Approach**:

- ❌ Tests become afterthought (often skipped under pressure)
- ❌ Low coverage (typically 30-50%)
- ❌ Hard to test tightly coupled code (requires refactoring)
- ❌ Bugs found late in cycle (QA or production)
- ❌ Tests validate implementation, don't drive design
- **Verdict**: Unacceptable for financial data platform

**Implementation**:

- **Red-Green-Refactor**: Write failing test → Make it pass → Clean up
- **Test-First Always**: No production code without a failing test
- **Coverage Targets**:
  - Domain entities: 100%
  - Services: 95%
  - Repositories: 90%
  - API routes: 90%
  - Components: 80%
  - Overall: 90%+
- **CI/CD Enforcement**: Tests block merges if failing or coverage drops

**Tools & Stack**:

```typescript
// Test Framework
"jest": "^29.7.0",                       // Test runner
"@testing-library/react": "^16.0.1",     // Component testing
"@testing-library/jest-dom": "^6.6.2",   // DOM matchers

// API Testing
"supertest": "^6.3.3",                   // HTTP integration tests
"node-mocks-http": "^1.13.0",            // Mock Next.js requests

// Mocking
"jest-mock-extended": "^3.0.5",          // Deep mocking (Prisma)
"msw": "^2.0.0",                         // Mock Service Worker (API mocking)

// Coverage
"@jest/globals": "^29.7.0",              // Jest globals
"jest-environment-jsdom": "^29.7.0"      // Browser environment
```

**Test Organization**:

```
domain/entities/__tests__/Report.test.ts         # Unit tests
services/__tests__/ReportService.test.ts         # Unit tests (mocked repos)
repositories/__tests__/Prisma...integration.test.ts  # Integration tests
app/api/reports/__tests__/route.test.ts         # API tests
components/reports/__tests__/ReportList.test.tsx # Component tests
__tests__/e2e/reportFlow.test.ts                 # E2E tests (minimal)
```

**Example TDD Cycle**:

```typescript
// 1. RED - Write failing test
describe('ReportService', () => {
  it('should create report with valid name', async () => {
    const report = await service.createReport('user-123', 'Q4 Report');
    expect(report.name).toBe('Q4 Report');
  });
});
// Run test → ❌ Fails (method doesn't exist)

// 2. GREEN - Make it pass
class ReportService {
  async createReport(userId: string, name: string): Promise<Report> {
    return ReportEntity.create({ userId, name });
  }
}
// Run test → ✅ Passes

// 3. REFACTOR - Clean up while keeping tests green
class ReportService {
  async createReport(userId: string, name: string): Promise<Report> {
    const report = ReportEntity.create({ userId, name: name.trim() });
    await this.reportRepository.save(report);
    return report;
  }
}
// Run test → ✅ Still passes
```

**ROI Calculation**:

- Development time increase: 30% (upfront investment)
- Debugging time decrease: 70% (catch bugs early)
- Production bugs decrease: 80% (high coverage)
- Refactoring velocity increase: 3x (test safety net)
- **Net ROI**: 3x faster feature velocity after initial 6 months

**Reference**: See `docs/TDD-GUIDE.md` for comprehensive TDD practices and patterns.

---

# DECISION SUMMARY TABLE

## NOW Phase

| Decision             | Choice                               | Rationale                              |
| -------------------- | ------------------------------------ | -------------------------------------- |
| **Database**         | PostgreSQL (Docker)                  | Production parity, seamless transition |
| **Markdown Editor**  | React SimpleMDE                      | Lightweight, simple API                |
| **Email Service**    | Resend.com                           | Best DX, reliable, free tier           |
| **OAuth Setup**      | Separate dev apps                    | Security best practice                 |
| **LlamaParse Quota** | Free tier (1K pages/day)             | Sufficient for development             |
| **File Hash**        | SHA-256                              | Secure, collision-resistant            |
| **Testing**          | Strict TDD (Test-Driven Development) | Quality first, 90%+ coverage           |

## NEXT Phase

| Decision           | Choice                    | Rationale                       |
| ------------------ | ------------------------- | ------------------------------- |
| **Cloud Database** | Supabase PostgreSQL       | All-in-one, integrated storage  |
| **File Storage**   | Supabase Storage          | Integrated, row-level security  |
| **Monitoring**     | Sentry + Vercel Analytics | Error tracking + performance    |
| **Pricing Model**  | Free tier + $10/month Pro | Freemium for adoption + revenue |

## LATER Phase

| Decision                  | Choice                | Rationale                           |
| ------------------------- | --------------------- | ----------------------------------- |
| **Collaboration Pricing** | $25/month (5 users)   | $5/user, competitive pricing        |
| **Mobile App**            | PWA (not native)      | Single codebase, instant updates    |
| **Transcription**         | OpenAI Whisper API    | Best accuracy, fair pricing         |
| **Search Provider**       | Self-hosted Typesense | Cost-effective, powerful features   |
| **API Monetization**      | Free (rate limited)   | Drive adoption, enable integrations |

---

# COST PROJECTIONS

## NOW Phase (Local Development)

**Monthly Cost**: $0

- Database: Docker PostgreSQL (free)
- Storage: Local filesystem (free)
- Email: Resend free tier (100/day)
- LlamaParse: Free tier (1K pages/day)
- OAuth: Free (Google, LinkedIn)

## NEXT Phase (50 Users, 250 Reports, 5K Documents)

**Monthly Cost**: ~$50-80

| Service                 | Cost                |
| ----------------------- | ------------------- |
| Supabase (DB + Storage) | $25                 |
| Vercel Pro (hosting)    | $20                 |
| Resend (emails)         | $0 (free tier)      |
| LlamaParse              | $10 (3,500 pages)   |
| Sentry                  | $0 (free tier)      |
| Domain                  | $1/month ($12/year) |
| **Total**               | **$56/month**       |

**Revenue Target**: 5 paid users × $10 = $50/month (break-even)

## LATER Phase (500 Users, 2.5K Reports, 50K Documents)

**Monthly Cost**: ~$250-350

| Service                 | Cost                 |
| ----------------------- | -------------------- |
| Supabase (DB + Storage) | $99 (scaled)         |
| Vercel Pro              | $20                  |
| Resend                  | $20 (emails)         |
| LlamaParse              | $30 (10K pages)      |
| Sentry                  | $26 (errors)         |
| Whisper API             | $180 (transcription) |
| Typesense (self-hosted) | $10 (DigitalOcean)   |
| Domain                  | $1                   |
| **Total**               | **$386/month**       |

**Revenue Target**: 50 paid users × $10 = $500/month (profitable)

---

# ENVIRONMENT VARIABLES REFERENCE

## NOW Phase (.env.local)

```bash
# Database
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/apex_dev

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth (dev app)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# LinkedIn OAuth (dev app)
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Resend (magic links)
RESEND_API_KEY=re_...

# LlamaParse
LLAMA_CLOUD_API_KEY=llx-...

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Local file storage path
STORAGE_PATH=./storage
```

## NEXT Phase (.env.production)

```bash
# Supabase
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# NextAuth (production)
NEXTAUTH_URL=https://apex.app
NEXTAUTH_SECRET=production-secret-from-vercel

# Google OAuth (production app)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# LinkedIn OAuth (production app)
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Resend
RESEND_API_KEY=re_...

# LlamaParse
LLAMA_CLOUD_API_KEY=llx-...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## LATER Phase (additions)

```bash
# Typesense
TYPESENSE_API_KEY=xyz...
TYPESENSE_HOST=search.apex.app

# OpenAI (Whisper)
OPENAI_API_KEY=sk-...

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

---

# NEXT STEPS

With all technical decisions made, we can now proceed to:

1. ✅ **Technical Specification** (ready to create):
   - Architecture diagrams
   - Database schema (PostgreSQL)
   - API design
   - Component structure
   - File organization

2. ✅ **Developer Implementation Guide** (ready to create):
   - Step-by-step setup
   - Development workflow
   - Testing strategy
   - Deployment checklist

**Recommendation**: Proceed to Technical Specification document creation.

---

**END OF TECHNICAL DECISIONS**
