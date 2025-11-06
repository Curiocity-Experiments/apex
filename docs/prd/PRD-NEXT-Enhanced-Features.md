# Product Requirements Document: Apex Enhanced Features

**Phase**: NEXT (Cloud Deployment + Enhanced Features)
**Status**: Draft v1.0
**Date**: 2025-11-06
**Prerequisites**: NOW phase complete and validated with users

---

## 1. Executive Summary

### What We're Building
Cloud-deployed version of Apex with expanded file type support, full-text search, and rich text editing. This phase transforms the local MVP into a production-ready SaaS platform accessible from any browser.

### Why This Phase
**NOW Phase Learnings** (assumptions to validate):
- Users validated core value: auto-organizing documents reduces search time
- Users requested: "I want to upload PDFs" (most common reference document format)
- Users requested: "I want to search inside documents, not just filenames"
- Users requested: "I need better formatting in my reports" (tables, images)

**NEXT Phase Goals**:
1. **Accessibility**: Deploy to cloud → users access from any device
2. **File Format Coverage**: Support 90% of common reference formats (PDF, Office, images)
3. **Search Power**: Full-text search across document content
4. **Editor Quality**: WYSIWYG editor for professional report formatting

### Success Metrics
- **Adoption**: 10+ active users (real financial analysts, not test users)
- **Engagement**: Average 3+ reports per user, 15+ documents per report
- **Retention**: 50%+ weekly active users (WAU)
- **File Type Distribution**: PDF uploads > 50% of total uploads
- **Search Usage**: 30%+ of document accesses via full-text search (not filename)

---

## 2. Changes from NOW Phase

### New Capabilities
1. **Cloud Deployment**: Accessible via public URL (e.g., apex.app)
2. **Cloud File Storage**: Files stored in Cloudflare R2 or Supabase Storage
3. **Cloud Database**: PostgreSQL (managed service like Supabase, Neon, or PlanetScale)
4. **Expanded File Types**: PDF, Word, Excel, PowerPoint, CSV, HTML, PNG, JPG, GIF
5. **Full-Text Search**: Search within document content (not just filenames)
6. **WYSIWYG Editor**: Rich text editing with tables, images, formatting
7. **Document Preview**: In-app preview for PDFs and images (no external app)
8. **Improved Duplicate Detection**: Hash-based (server-side) instead of filename-based

### Unchanged from NOW
- Desktop-first (no mobile optimization yet)
- Single-user (no collaboration)
- Report-scoped tags (not global yet)
- Social + magic link authentication
- LlamaParse for file parsing
- PostHog analytics

---

## 3. Core Enhancements (WHAT + WHY)

### 3.1 Cloud Deployment

**What**: Deploy application to production cloud infrastructure

**Why**:
- **Accessibility**: Users access from home, office, any browser
- **Reliability**: Uptime SLA, automatic backups, disaster recovery
- **Performance**: CDN for fast global access
- **Updates**: Deploy fixes/features without requiring user action

**Platform Options**:
- **Preferred**: Vercel (Next.js optimized, zero config)
- **Alternative**: Railway, Render, Fly.io (PostgreSQL included)

**Requirements**:
- HTTPS only (SSL certificate)
- Custom domain (e.g., apex.app)
- Environment variable management (secrets)
- Automatic deployments from main branch
- Staging environment for testing

**Acceptance Criteria**:
- App accessible via public URL 24/7
- Uptime > 99.5% (measured via uptime monitor)
- SSL certificate valid and auto-renewing
- Deploy new version in < 10 minutes (CI/CD pipeline)

---

### 3.2 Cloud File Storage (Cloudflare R2 or Supabase Storage)

**What**: Store uploaded files in cloud object storage instead of local filesystem

**Why**:
- **Scalability**: Handle 10,000+ files without server disk space issues
- **Durability**: 99.999999999% durability (11 9's) - no data loss
- **Cost**: Cloudflare R2 cheaper than S3 (no egress fees)
- **Performance**: CDN-backed retrieval, fast global access

**Storage Provider Options**:

**Option A: Cloudflare R2** (Preferred)
- **Pros**: Zero egress fees, S3-compatible API, cheap storage ($0.015/GB/month)
- **Cons**: Newer service, smaller ecosystem than S3

**Option B: Supabase Storage**
- **Pros**: Integrated with Supabase DB, simple API, generous free tier
- **Cons**: Egress fees after free tier

**Architecture**:
- Files uploaded to R2/Supabase via presigned URLs
- Original files stored at: `{userId}/{reportId}/{documentId}.{ext}`
- Parsed markdown stored at: `{userId}/{reportId}/{documentId}.parsed.md`
- Public URLs generated for file access (time-limited signed URLs)

**Acceptance Criteria**:
- Files upload directly to cloud (not through server)
- Upload progress indicator (chunked upload for large files)
- Files retrievable via public URL (signed, expires in 1 hour)
- Failed uploads show clear error message with retry button
- Storage costs < $5/month for 100 users (assumed 50GB total)

**Security**:
- Presigned URLs expire after 1 hour
- Files private by default (not publicly listable)
- User can only access their own files (enforced server-side)

---

### 3.3 Expanded File Type Support

**What**: Support common reference document formats

**Supported Formats (NEXT)**:
- ✅ **PDF** (.pdf) - Most common reference format
- ✅ **Word** (.docx, .doc) - Microsoft Word documents
- ✅ **Excel** (.xlsx, .xls) - Spreadsheets
- ✅ **PowerPoint** (.pptx, .ppt) - Presentations
- ✅ **CSV** (.csv) - Data tables
- ✅ **HTML** (.html, .htm) - Web pages
- ✅ **Images** (.png, .jpg, .jpeg, .gif) - Screenshots, charts, diagrams
- ✅ **TXT** (.txt) - Plain text (from NOW)
- ✅ **Markdown** (.md) - Markdown files (from NOW)

**Why Each Format**:
- **PDF**: Earnings reports, regulatory filings, research papers (80% of uploads expected)
- **Word**: Draft reports, analyst notes
- **Excel**: Financial models, data tables
- **PowerPoint**: Company presentations, pitch decks
- **CSV**: Raw data exports
- **HTML**: Saved web articles, company pages
- **Images**: Screenshots of charts, infographics

**Parsing Strategy**:
- **LlamaParse Handles**: PDF, Word, Excel, PowerPoint, images (OCR), HTML
- **No Parsing Needed**: TXT, Markdown, CSV (already text)
- **Client-Side Rendering**: Images (display inline), CSV (render as table)

**File Size Limits**:
- PDF, Word, PowerPoint: 50MB max
- Excel, CSV: 25MB max
- Images: 10MB max
- TXT, Markdown: 5MB max

**Acceptance Criteria**:
- All file types upload successfully
- LlamaParse extracts text from PDFs with > 95% success rate
- Images display inline in document viewer
- CSV files render as formatted tables
- Unsupported file types show clear error message before upload

---

### 3.4 Full-Text Search in Document Content

**What**: Search within parsed document content, not just filenames

**Why**:
- **NOW Phase Limitation**: User can only search filenames → frustrating when they remember content but not filename
- **User Need**: "I remember the document mentioned 'supply chain disruption' but forgot which file"
- **Value**: Find documents 10x faster when user remembers a quote or keyword

**Search Behavior**:
- **Query Input**: Single search box (same as NOW, but expanded functionality)
- **Search Scope**:
  - Document filenames (existing NOW behavior)
  - Document parsed content (NEW)
  - Document notes (NEW)
  - Document tags (NEW)
- **Results Display**: Show matches with context snippet
  - Filename matches: Show filename highlighted
  - Content matches: Show filename + snippet with match highlighted
  - Note matches: Show filename + note excerpt with match highlighted

**Search Implementation Options**:

**Option A: PostgreSQL Full-Text Search** (Preferred for NEXT)
- **Pros**: No additional infrastructure, built into PostgreSQL, fast for < 10,000 documents
- **Cons**: Limited ranking, no fuzzy search, slower than dedicated search engine

**Option B: Typesense / Meilisearch** (Consider for LATER if needed)
- **Pros**: Better ranking, fuzzy search, instant results, autocomplete
- **Cons**: Additional service to manage, cost, complexity

**NEXT Phase Choice**: Use PostgreSQL Full-Text Search (simpler, faster to implement, sufficient for expected scale)

**Search Features**:
- **Instant Search**: Results update as user types (debounced 300ms)
- **Highlight Matches**: Show query terms highlighted in yellow
- **Snippet Context**: Show 2 lines of surrounding text for content matches
- **Ranking**: Filename matches ranked higher than content matches
- **Filters**: Can combine search with tag filters

**Example Search Results**:

*User searches: "supply chain"*

```
📄 Q3-earnings-meta.txt
   Filename match

📄 industry-report-2024.pdf
   "...challenges in the supply chain have led to 15% cost
   increases across the sector..."

📄 competitor-analysis.docx
   Note: "Mention supply chain advantages in final report"
```

**Acceptance Criteria**:
- Search returns results in < 500ms for 1000 documents
- Highlights exact match terms (not fuzzy)
- Results ranked: exact filename match > content match > note match
- Empty search shows all documents (same as NOW)
- Search works across all supported file types (parsed content)

**Non-Functional Requirements**:
- Index updated immediately after document upload (no delay)
- Search supports special characters (" ' - / etc.) in queries
- Case-insensitive search

---

### 3.5 WYSIWYG Rich Text Editor

**What**: Replace markdown editor with visual rich text editor

**Why**:
- **NOW Phase Limitation**: Markdown requires learning syntax → barrier for non-technical users
- **User Need**: Format reports professionally (tables, headers, bullet points) without thinking about syntax
- **Comparable to**: Google Docs, Notion, Microsoft Word (familiar UX)

**Editor Features**:

**Formatting**:
- Text: Bold, italic, underline, strikethrough
- Headings: H1, H2, H3
- Lists: Bulleted, numbered, nested
- Links: Insert hyperlinks
- Quotes: Block quotes
- Code: Inline code, code blocks (for formulas or data)

**Advanced Features**:
- **Tables**: Insert tables for financial data
  - Add/remove rows and columns
  - Cell alignment (left, center, right)
  - Header row styling
- **Images**: Paste images directly into report
  - Upload inline (stored in file storage)
  - Resize images (drag corners)
  - Alt text for accessibility
- **Dividers**: Horizontal rules for sections

**Editor Library Options**:

**Option A: Tiptap** (Preferred)
- **Pros**: Headless (full control), extensible, React-friendly, modern
- **Cons**: More setup than TinyMCE

**Option B: TinyMCE**
- **Pros**: Feature-rich out-of-box, stable, widely used
- **Cons**: Large bundle size, less customizable

**NEXT Phase Choice**: Tiptap (better developer experience, lighter bundle)

**Content Storage**:
- **Format**: JSON (Tiptap native format) or HTML
- **Database**: Store as TEXT field in PostgreSQL
- **Markdown Support**: Can import existing markdown reports and convert to HTML on load

**Acceptance Criteria**:
- Editor loads in < 1 second (lightweight bundle)
- All formatting options work reliably
- Paste from Word/Google Docs preserves formatting
- Tables resize correctly
- Images upload and display inline
- Auto-save every 30 seconds (same as NOW)
- Undo/redo works for all operations

**Non-Functional Requirements**:
- Editor works in Chrome 90+, Firefox 88+, Safari 14+
- No lag typing (60 FPS minimum)
- Bundle size < 500KB (to keep page load fast)

---

### 3.6 Document Preview (In-App Viewing)

**What**: View PDF and image files directly in the app (no external download)

**Why**:
- **NOW Phase Limitation**: Clicking original file opens in new tab or downloads → context switch
- **User Need**: Quickly scan document without leaving report editor
- **Efficiency**: View PDF pages 1-3 to verify it's the right file → 5 seconds vs. 30 seconds (download + open + close)

**Preview Features**:

**PDF Preview**:
- **Viewer**: Embedded PDF viewer (pdf.js or browser native)
- **Controls**: Zoom in/out, page navigation, download button
- **Performance**: Load first page instantly, lazy-load remaining pages
- **Page Count**: Show "Page 1 of 25" indicator

**Image Preview**:
- **Display**: Show full image in viewer panel
- **Controls**: Zoom, pan, rotate, download
- **Formats**: PNG, JPG, GIF (static images)

**Text Files (TXT, MD, CSV)**:
- **Display**: Syntax-highlighted text (same as NOW)
- **CSV**: Render as formatted table (NEW)

**Other Formats (Word, Excel, PowerPoint)**:
- **Display**: Show parsed markdown content (LlamaParse output)
- **Original File**: Button to download original if needed

**Acceptance Criteria**:
- PDF previews load first page in < 2 seconds
- Image previews load in < 1 second
- PDF zoom controls work smoothly (pinch zoom on trackpad)
- Can navigate PDF pages with arrow keys
- Download button downloads original file (not preview)

---

### 3.7 Improved Duplicate Detection

**What**: Server-side hash calculation for faster and more accurate duplicate detection

**Why**:
- **NOW Phase Limitation**: Client-side hashing slow for large files (5+ seconds for 50MB PDF)
- **User Experience**: Upload starts immediately, duplicate check happens server-side in parallel
- **Accuracy**: Hash calculated from actual file bytes, not filename

**Workflow**:
1. User uploads file → starts immediately (no client-side hash calculation)
2. File uploads to cloud storage (Cloudflare R2)
3. Server calculates hash (MD5 or SHA-256) from uploaded file
4. Server checks database: "Does this report already have document with this hash?"
5. If duplicate:
   - Delete just-uploaded file from storage (cleanup)
   - Show user: "Duplicate detected: 'filename.pdf' already exists in this report"
   - Give option: "View existing document"
6. If not duplicate:
   - Continue with LlamaParse extraction
   - Save document metadata to database

**Hash Algorithm**: SHA-256 (more secure than MD5, still fast enough)

**Acceptance Criteria**:
- Duplicate detection completes within 5 seconds of upload finishing
- User sees clear message: "This file already exists in your report"
- Can still upload duplicate to different report (detection is per-report)
- Duplicate detection works across all file types

---

## 4. Enhanced User Workflows

### Workflow 1: Upload PDF Earnings Report

**Scenario**: Sarah uploads a 10MB PDF earnings report

**Steps**:
1. Sarah drags "Meta-Q3-2024-Earnings.pdf" into report editor
2. Upload progress bar appears: "Uploading... 45%"
3. After 8 seconds: "Uploaded ✓ - Parsing document..."
4. After 15 seconds: "Ready ✓"
5. PDF appears in document list with 📄 PDF icon
6. Sarah clicks document name → PDF preview loads (first page visible)
7. Sarah scrolls through PDF pages using mouse wheel
8. Finds revenue chart on page 12 → zooms in
9. Adds note: "Revenue chart shows 23% YoY growth, use for intro"
10. Tags document: "financial-data", "q3-2024"
11. Continues writing report

**Success**: PDF uploaded, parsed, and viewable in < 30 seconds total.

---

### Workflow 2: Search for Specific Data Point

**Scenario**: Sarah remembers a document mentioned "margin expansion" but forgot which file

**Steps**:
1. Sarah types in search box: "margin expansion"
2. Results update instantly (300ms):
   - **competitor-analysis.docx**: "...margin expansion of 3.2% driven by operational efficiency..."
   - **industry-trends.pdf**: "...sector-wide margin expansion trend continuing into Q4..."
3. Sarah clicks "competitor-analysis.docx"
4. Document preview loads with "margin expansion" highlighted in yellow
5. Sarah reviews context around match
6. Finds exact number: "3.2%"
7. Returns to report editor, types: "Competitor achieved margin expansion of 3.2%..."

**Success**: Found specific data point in < 10 seconds using full-text search.

---

### Workflow 3: Format Report with Table

**Scenario**: Sarah wants to add a comparison table to her report

**Steps**:
1. Sarah writing in rich text editor: "Key Metrics Comparison:"
2. Clicks "Insert Table" button in toolbar
3. Modal: "Rows: 4, Columns: 3"
4. Table inserted with 4 rows, 3 columns
5. Sarah fills in:
   - Header row: "Company | Revenue | Growth"
   - Row 2: "Meta | $31.2B | 23%"
   - Row 3: "Alphabet | $76.7B | 11%"
   - Row 4: "Amazon | $143.1B | 13%"
6. Sarah clicks table → formatting options appear
7. Sets header row to bold, centers all columns
8. Table renders beautifully in report

**Success**: Created formatted table in < 2 minutes, no markdown syntax needed.

---

## 5. Technical Architecture (NEXT Phase)

### Infrastructure Stack

**Frontend**:
- Framework: Next.js 14+ (App Router)
- Hosting: Vercel (automatic deployments)
- UI Library: React 18+, Tailwind CSS
- Editor: Tiptap (WYSIWYG)
- State: Zustand or Jotai (lightweight global state)

**Backend**:
- API: Next.js API routes (serverless functions)
- Database: PostgreSQL (Supabase, Neon, or PlanetScale)
- ORM: Prisma or Drizzle ORM
- Authentication: NextAuth.js (Google, LinkedIn, Magic Link)
- File Storage: Cloudflare R2 or Supabase Storage

**External Services**:
- **LlamaParse API**: Document parsing
- **Email Service**: Resend or SendGrid (magic links)
- **Analytics**: PostHog (usage tracking)
- **Monitoring**: Sentry (error tracking), Vercel Analytics (performance)

### Database Schema (PostgreSQL)

**Tables**:

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Reports
reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB,  -- Tiptap JSON or HTML
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Full-text search index
  content_search TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || content)
  ) STORED
)

-- Report Tags
report_tags (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(report_id, tag)
)

-- Documents
documents (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_url TEXT NOT NULL,  -- R2/Supabase URL
  parsed_content TEXT,  -- LlamaParse output
  file_hash TEXT NOT NULL,  -- SHA-256 hash
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Full-text search index
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', filename || ' ' || COALESCE(parsed_content, '') || ' ' || COALESCE(notes, ''))
  ) STORED
)

-- Document Tags
document_tags (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(document_id, tag)
)

-- Sessions (for NextAuth)
sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL
)

-- Indexes for full-text search
CREATE INDEX idx_reports_search ON reports USING GIN(content_search);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- Indexes for performance
CREATE INDEX idx_documents_report_id ON documents(report_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_document_tags_document_id ON document_tags(document_id);
```

### File Storage Structure (Cloudflare R2)

```
bucket/
├── users/
│   └── {userId}/
│       └── reports/
│           └── {reportId}/
│               └── documents/
│                   ├── {documentId}.pdf (original file)
│                   ├── {documentId}.docx
│                   └── {documentId}.png
└── uploads/
    └── temp/  (temporary uploads, cleaned up after 24 hours)
```

### Search Implementation (PostgreSQL Full-Text)

**Search Query Example**:
```sql
-- Search documents by content
SELECT
  id,
  filename,
  ts_headline('english', parsed_content, query) AS snippet,
  ts_rank(search_vector, query) AS rank
FROM documents, to_tsquery('english', 'supply & chain') AS query
WHERE search_vector @@ query
  AND report_id = $reportId
ORDER BY rank DESC
LIMIT 20;
```

---

## 6. Success Criteria (NEXT Phase)

### User Success Metrics

**Adoption**:
- Target: 10+ active users within 30 days of launch
- Measurement: PostHog weekly active users (WAU)

**Engagement**:
- Target: 3+ reports per user (median)
- Target: 15+ documents per report (median)
- Measurement: Database queries (average reports/user, average documents/report)

**Retention**:
- Target: 50%+ weekly active users (return at least once per week)
- Measurement: PostHog retention cohorts

**Feature Adoption**:
- Target: PDF uploads > 50% of total uploads
- Target: Full-text search used in 30%+ of document accesses
- Target: WYSIWYG editor formatting used (tables, images) in 40%+ of reports
- Measurement: PostHog event tracking

### Technical Success Metrics

**Performance**:
- Page load (report editor): < 2 seconds (P95)
- File upload (10MB PDF): < 10 seconds (P95)
- Full-text search: < 500ms (P95)
- Uptime: > 99.5%

**Quality**:
- Zero data loss incidents
- LlamaParse success rate: > 95% for PDFs
- Search relevance: Top 5 results contain answer 80%+ of the time (user testing)

---

## 7. Out of Scope (NEXT)

### Features NOT in NEXT:
- ❌ Mobile responsive design (desktop only, 1280px+ width)
- ❌ Collaboration or sharing features
- ❌ Audio/video file support
- ❌ Advanced search (fuzzy search, autocomplete, filters beyond tags)
- ❌ Export reports (PDF, Word)
- ❌ Version history for reports
- ❌ Keyboard shortcuts
- ❌ Dark mode
- ❌ Internationalization (English only)
- ❌ Global tags (tags still report-scoped)

---

## 8. Risks & Mitigation

### Risk 1: Cloud Costs Higher Than Expected
- **Impact**: Monthly costs exceed budget ($50/month assumed)
- **Mitigation**: Monitor costs weekly, set billing alerts, implement file size quotas per user

### Risk 2: LlamaParse Quota Exceeded
- **Impact**: Document parsing fails, users can't search content
- **Mitigation**: Implement queue system, rate limit uploads to 10 files per 10 minutes per user

### Risk 3: Search Performance Degrades
- **Impact**: Full-text search slow (> 1 second) with 10,000+ documents
- **Mitigation**: Monitor query performance, add database indexes, consider upgrading to Typesense if needed

---

## 9. Open Questions

1. **Cloud Database Provider**: Supabase (integrated storage) vs. Neon (faster) vs. PlanetScale (autoscaling)?
   - **Decision Needed By**: Before infrastructure setup

2. **File Storage Provider**: Cloudflare R2 vs. Supabase Storage?
   - **Decision Needed By**: Before upload implementation

3. **Email Service**: Resend vs. SendGrid for magic links?
   - **Decision Needed By**: Before authentication implementation

4. **Monitoring Stack**: Sentry for errors + Vercel Analytics, or add Datadog/New Relic?
   - **Decision Needed By**: Before production deployment

5. **Pricing Model**: Free tier (limited storage) or paid-only ($10/month)?
   - **Decision Needed By**: Before public launch

---

**END OF PRD-NEXT (Enhanced Features)**
