# Product Requirements Document: ResearchHub Core MVP

**Phase**: NOW (Core MVP for Local Development)
**Status**: Draft v1.0
**Date**: 2025-11-06
**Target**: Minimum viable platform solving core user problem locally

---

## 1. Executive Summary

### What We're Building
A desktop-first research management platform that helps financial analysts and knowledge workers organize reference documents while writing long-form reports. Users can upload reference materials at any point during their writing process, and the platform automatically organizes these documents, keeping writers in flow state.

### Why We're Building This
**Core Problem**: Financial analysts lose their train of thought while searching for reference documents during report writing. Context switching between writing and file management disrupts deep work.

**Solution**: Auto-organizing document repository attached to each report, allowing instant upload and retrieval without leaving the writing interface.

### Success Metrics
- **Primary**: Time from "need document" to "document accessible" < 10 seconds
- **Primary**: User can upload 5+ documents without context switching
- **Secondary**: Zero file naming/organization decisions required from user

---

## 2. Target User

### Primary Persona: "Sarah, Financial Research Analyst"

**Demographics**:
- Role: Research analyst, portfolio manager, consultant
- Experience: 3-10 years professional experience
- Environment: Desktop workstation, multiple monitors
- Technical proficiency: Comfortable with web apps, not a power user

**Current Workflow Pain Points**:
1. Writing report in Word/Google Docs
2. Needs to reference an earnings report → switches to Finder/Explorer
3. Searches across multiple folders → "was it Q3 or fiscal 2023?"
4. Opens file, copies data → switches back to report
5. **Repeat 20-50 times per report** → massive context switching
6. Often re-searches same files multiple times (forgot where it was)

**Job to Be Done**:
> "When I'm writing a research report and need to reference a source document, I want to instantly access and search my reference materials without leaving my writing environment, so I can maintain flow and finish reports faster."

### Out of Scope Users (for NOW)
- Teams requiring collaboration
- Mobile-first users
- Users requiring real-time co-authoring
- Users needing complex folder hierarchies

---

## 3. Core Capabilities (WHAT)

### 3.1 Report Management

**User can create and manage research reports**

**Capabilities**:
- Create new report with name
- Edit report content using Markdown editor
- View all reports in a list/grid
- Open/close reports
- Delete reports (with confirmation)
- Search reports by name
- Sort reports by: Date Created, Date Modified, Name

**Why This Matters**:
Reports are the core organizing unit. Each report represents one research deliverable (e.g., "Q4 2024 Tech Sector Analysis"). Users need quick access to switch between active projects.

**Acceptance Criteria**:
- User can create report in < 5 seconds (single modal, name only)
- Report list shows most recent first by default
- Deleting report shows warning: "This will delete [N] documents. Are you sure?"
- Markdown editor supports: headers, lists, bold, italic, links, code blocks
- Auto-save: saves content every 30 seconds or on manual trigger

**Non-Functional Requirements**:
- Report list loads < 500ms for up to 100 reports
- Markdown editor responsive on 1080p+ displays
- No data loss on browser refresh (local persistence)

---

### 3.2 Document Upload & Organization

**User can upload reference documents to a report**

**Capabilities**:
- Upload files via file picker (single or multiple files)
- Upload files via drag-and-drop to report area
- View uploaded documents list within report
- Rename uploaded documents
- Delete uploaded documents
- See document upload status (uploading, parsing, ready)

**Supported File Types (NOW)**:
- `.txt` (plain text)
- `.md` (Markdown)

**Why This Matters**:
Uploading must be **friction-free** and **non-disruptive**. User should never leave their writing interface. Limiting to TXT/MD for MVP reduces complexity while proving core value.

**Duplicate Detection**:
- **Filename Check**: Warn if filename exists in current report
- **Hash Validation**: Calculate file hash, prevent upload if identical file exists
- **User Choice**: Show modal: "Document '[name]' already exists. Upload anyway? (Yes/No)"
- **Scope**: Duplicates detected per-report only (same file can exist in multiple reports)

**Auto-Parsing**:
- All uploaded files sent to LlamaParse API
- Extracted markdown stored alongside original file
- Parsing happens asynchronously (user can continue working)
- Show parsing status: "Parsing..." → "Ready" or "Parse failed"

**Acceptance Criteria**:
- Drag-drop works anywhere in report view area
- Multi-file upload processes files sequentially with progress indicator
- Upload completes in background (user can continue editing report)
- Duplicate warning appears before upload starts (prevents wasted parsing)
- Parsed content available within 30 seconds of upload (LlamaParse SLA)

**Non-Functional Requirements**:
- File size limit: 25MB per file (LlamaParse limit)
- Max files per report: 500 documents
- Upload progress visible (file 3 of 5 uploading...)

---

### 3.3 Document Viewing & Search

**User can quickly find and view uploaded documents**

**Capabilities**:
- View list of all documents in current report
- Search documents by filename (case-insensitive, partial match)
- Sort documents by: Name (A-Z, Z-A), Date Added, Date Modified
- Click document to view parsed content in side panel
- View original file (opens in system default app or browser)
- Filter by file type (TXT, MD - badges/icons shown)

**Document Viewer**:
- **Left Panel**: Report markdown editor
- **Right Panel**: Document list + selected document viewer
- **Resizable Panels**: Drag divider to adjust widths
- **Viewer Modes**:
  - Markdown view: Rendered markdown with syntax highlighting
  - Raw view: Plain text content

**Search Behavior**:
- **NOW (MVP)**: Filename search only (client-side filtering)
- Search-as-you-type (no submit button)
- Highlights matching text in filename
- Empty search shows all documents

**Why This Matters**:
Fast retrieval is critical. User should find document in < 5 seconds:
1. Type 3-4 characters of filename
2. See filtered list
3. Click to view

**Acceptance Criteria**:
- Search filters results in < 100ms (client-side)
- Document viewer loads parsed content in < 500ms
- Viewer supports markdown rendering (headers, lists, code blocks)
- Clicking original file opens in new tab/window

**Non-Functional Requirements**:
- Panel resize persists for session (localStorage)
- Document list virtualized for 100+ files (smooth scrolling)

---

### 3.4 Document Metadata & Notes

**User can add context to individual documents**

**Capabilities**:
- Add/edit notes for each document (separate from report content)
- Add/remove tags to documents (report-scoped tags)
- View document metadata: filename, upload date, file type, file size
- Edit document name (renames reference, not original file)

**Document Notes**:
- **Purpose**: Notes about specific source document (e.g., "Key data on page 12", "Author's assumptions flawed")
- **Editor**: Simple textarea (plain text) for NOW
- **Storage**: Stored with document metadata
- **Access**: Click "Add Note" button in document viewer

**Document Tags**:
- **Purpose**: Categorize documents within report (e.g., "financial-data", "competitor-analysis", "regulation")
- **Scope**: Tags are report-specific (each report has own tag namespace)
- **Creation**: Type tag name, press Enter (autocomplete from existing tags in current report)
- **Display**: Show as colored badges in document list
- **Filter**: Click tag to filter document list to that tag

**Why This Matters**:
Users need to capture quick context about documents without disrupting writing flow. Tags enable fast filtering when report has 50+ documents.

**Acceptance Criteria**:
- Notes save automatically on blur or Ctrl+S
- Tags created inline (no separate modal)
- Tag autocomplete shows existing tags from current report
- Clicking tag filters to show only documents with that tag
- Can apply multiple tags per document
- Tag colors auto-assigned (consistent per tag name)

---

### 3.5 Report Tags & Organization

**User can categorize and filter reports**

**Capabilities**:
- Add/remove tags to reports (global tags, shared across reports)
- Filter report list by tag
- See tag count on each report card
- Create tags inline (no pre-defined taxonomy)

**Report Tags** (different from Document Tags):
- **Purpose**: Organize reports by project, client, time period (e.g., "q4-2024", "tech-sector", "client-acme")
- **Scope**: Global tags (shared across all reports)
- **Display**: Show on report card, clickable to filter
- **Multiple Tags**: Reports can have multiple tags

**Why This Matters**:
Users manage multiple reports simultaneously (3-5 active, 20+ archived). Tags enable quick filtering: "Show me all Q4 2024 reports" or "All reports for Client ACME."

**Acceptance Criteria**:
- Tags created inline when editing report (type + Enter)
- Clicking tag on report card filters report list
- Tag filter shows count: "Tech Sector (12)"
- Can filter by multiple tags (AND logic)
- Clear filters button visible when filters active

---

### 3.6 Authentication

**User can securely access their reports**

**Capabilities**:
- **Social Login**: Sign in with Google or LinkedIn
- **Magic Link**: Sign in via email (no password)
- Sign out
- Session persistence (stay logged in for 30 days)

**Authentication Flows**:

**1. Social Login (Google/LinkedIn)**:
- User clicks "Sign in with Google" or "Sign in with LinkedIn"
- OAuth redirect to provider
- On success: Create user account (if new) or log in (if existing)
- Redirect to report dashboard

**2. Magic Link Email**:
- User enters email address
- System sends email with one-time link (valid 15 minutes)
- User clicks link in email
- Authenticated and redirected to dashboard
- No password required

**Why Magic Link**:
- Zero password friction (no "forgot password" flow needed)
- Secure (time-limited, one-time use)
- Better UX than password for knowledge workers who use email constantly

**Session Management**:
- JWT-based sessions
- 30-day expiration
- Refresh token for long sessions

**Why This Matters**:
Minimal authentication friction. Users want to write reports, not manage passwords. Social login + magic link covers 95% of use cases for professional users.

**Acceptance Criteria**:
- Social login completes in < 10 seconds
- Magic link email arrives within 60 seconds
- Magic link works once, expires after use or 15 minutes
- Session persists across browser restarts (30 days)
- Sign out clears session immediately

**Non-Functional Requirements**:
- Email delivery 99.9% success rate (use reliable service like Resend, SendGrid)
- OAuth callback handles errors gracefully (user sees error message, can retry)

---

### 3.7 Local File Storage

**System stores files locally during development**

**Capabilities** (System-level, not user-facing):
- Save uploaded files to local filesystem
- Organize files by user and report
- Store original files + parsed markdown separately
- Retrieve files by reference ID

**Directory Structure**:
```
storage/
├── users/
│   └── {userId}/
│       └── reports/
│           └── {reportId}/
│               ├── documents/
│               │   ├── {documentId}.txt
│               │   └── {documentId}.md
│               └── parsed/
│                   └── {documentId}.md
```

**Why This Matters**:
Local filesystem storage for NOW phase enables fast development without cloud infrastructure dependencies. Production-like architecture but simpler implementation.

**File Naming**:
- Use UUIDs for document IDs (prevents collisions)
- Store original filename in database metadata
- Keep original file extension for MIME type detection

**Acceptance Criteria**:
- Files persist across server restarts
- No file permission errors (appropriate read/write permissions)
- Handles spaces and special characters in filenames
- Storage path configurable via environment variable

---

## 4. User Workflows

### Workflow 1: Create New Report and Add First Document

**Scenario**: Sarah starts research on Q4 Tech Sector Analysis

**Steps**:
1. Sarah clicks "New Report" button
2. Modal appears: "Report Name: ___"
3. Types: "Q4 2024 Tech Sector Analysis"
4. Clicks "Create"
5. Report editor opens (blank markdown editor)
6. Sarah drags an earnings report (TXT file) from her desktop into the editor area
7. Upload indicator appears: "Uploading earnings-q3-meta.txt..."
8. File uploads → parsing starts: "Parsing..."
9. After 10 seconds: Document appears in right panel list
10. Sarah clicks document name → parsed content displays in viewer
11. Sarah adds note: "Focus on revenue guidance, page 3"
12. Continues writing report in left panel markdown editor

**Success**: Document uploaded and accessible in < 30 seconds, zero context switching.

---

### Workflow 2: Find Document While Writing

**Scenario**: Sarah is mid-paragraph, needs to reference specific data

**Steps**:
1. Sarah typing in markdown editor: "According to the Q3 earnings report..."
2. Needs exact revenue figure → looks at right panel document list
3. Types in search box: "earnings q3"
4. List filters to show 2 documents: "earnings-q3-meta.txt", "earnings-q3-alphabet.txt"
5. Clicks "earnings-q3-meta.txt"
6. Viewer shows parsed content → scrolls to find revenue data
7. Copies number: "$31.2B"
8. Returns to editor, pastes: "...revenue of $31.2B..."
9. Search box still shows "earnings q3" → clears it to see all documents again

**Success**: Found document in < 5 seconds, never left browser window.

---

### Workflow 3: Organize Documents with Tags

**Scenario**: Sarah's report now has 25 documents, needs better organization

**Steps**:
1. Sarah uploads 5 new regulatory filings
2. Wants to categorize as "regulation" for easy filtering
3. Clicks on first document in list
4. In document viewer, sees "Tags: ___" input
5. Types "regulation" + Enter
6. Tag badge appears: 🏷️ regulation
7. Clicks next 4 documents, types "reg" → autocomplete suggests "regulation" → selects it
8. Now has 5 documents tagged "regulation"
9. Clicks "regulation" tag badge in document list
10. List filters to show only regulation docs
11. Later: Types "reg" in search box → also filters to regulation-tagged docs

**Success**: Organized 5 documents in < 30 seconds, can filter instantly.

---

### Workflow 4: Review All Reports and Find One from Last Quarter

**Scenario**: Sarah needs to reference her Q3 analysis for Q4 report

**Steps**:
1. Sarah clicks "ResearchHub" logo (top-left) → returns to report list
2. Sees 15 reports in grid view
3. Remembers it was tagged "tech-sector"
4. Clicks "tech-sector" tag filter
5. List narrows to 4 reports
6. Sorts by "Date Modified" descending
7. Sees "Q3 2024 Tech Sector Analysis" second in list
8. Clicks to open
9. Reviews previous analysis
10. Finds key insight → copies text
11. Returns to Q4 report (browser back or click "Q4 2024..." in recent reports)
12. Pastes insight and continues writing

**Success**: Found previous report in < 10 seconds using tags and sorting.

---

### Workflow 5: Delete Duplicate Document

**Scenario**: Sarah accidentally uploads same file twice

**Steps**:
1. Sarah drags "competitor-analysis.txt" into report
2. Upload starts → system calculates hash
3. Hash matches existing document
4. Modal appears: "⚠️ Duplicate Document - 'competitor-analysis.txt' already exists in this report. Upload anyway?"
5. Options: "Cancel" | "Upload Anyway"
6. Sarah clicks "Cancel" (realizes mistake)
7. Upload cancels, no duplicate created

**Alternative Flow (intentional duplicate)**:
5. Sarah clicks "Upload Anyway" (maybe it's an updated version)
6. System uploads as "competitor-analysis (2).txt"
7. Both versions now in document list

**Success**: Prevented unintentional duplicate, gave user control.

---

## 5. Technical Constraints (NOW Phase)

### Platform
- **Deployment**: Local development only (not deployed to cloud)
- **Environment**: Developer machine (macOS, Linux, or Windows)
- **Access**: `localhost:3000` or `127.0.0.1:3000`

### File Storage
- **Type**: Local filesystem (not S3, not cloud)
- **Location**: Configurable via env var (default: `./storage/`)
- **Persistence**: Files survive server restarts

### Database
- **Type**: SQLite or PostgreSQL (local instance)
- **Location**: Local database file or Docker container
- **Migrations**: Schema migrations handled via migration tool (Prisma, Drizzle, etc.)

### Authentication
- **Providers**: Google OAuth, LinkedIn OAuth (developer credentials)
- **Magic Link**: Email service required (Resend, SendGrid, or local SMTP for testing)
- **Session**: JWT stored in httpOnly cookie

### Parsing
- **Service**: LlamaParse API (requires API key)
- **Fallback**: If API fails, store original file without parsed content (show warning)
- **Quota**: Developer tier (free tier acceptable for testing)

### Performance Targets
- **Page Load**: < 2 seconds (report list, report editor)
- **Upload**: < 5 seconds for 5MB file (parse time excluded)
- **Search**: < 100ms (client-side filename search)
- **Auto-save**: Every 30 seconds (debounced)

---

## 6. Out of Scope (NOW)

### Features Explicitly NOT in NOW:
- ❌ Cloud deployment (Vercel, AWS, etc.)
- ❌ File types beyond TXT/MD (PDF, Word, Excel, etc.)
- ❌ Full-text search in document content (only filename search)
- ❌ WYSIWYG editor (markdown only)
- ❌ Folder structures (tags only for organization)
- ❌ Profile photos or customization
- ❌ Mobile responsive design (desktop only, 1280px+ width)
- ❌ Collaboration or sharing features
- ❌ Real-time sync between devices
- ❌ Advanced filtering (date range, file size, etc.)
- ❌ Export reports (PDF, Word, etc.)
- ❌ Keyboard shortcuts (beyond standard browser shortcuts)
- ❌ Dark mode
- ❌ Internationalization (English only)

### Acceptable Limitations (NOW):
- ⚠️ Single-user per instance (no multi-tenancy)
- ⚠️ No data backup/restore (manual file backup only)
- ⚠️ No version history for reports or documents
- ⚠️ No undo/redo in markdown editor (browser default only)
- ⚠️ Manual refresh needed if LlamaParse fails (no auto-retry)

---

## 7. Success Criteria

### User Success Metrics

**Primary Goal**: Reduce time spent searching for documents
- **Baseline**: 5-10 minutes per document search (current workflow)
- **Target**: < 10 seconds to find document (90th percentile)
- **Measurement**: Time from search initiation to document viewed

**Secondary Goal**: Enable flow state for writing
- **Metric**: User can upload 5+ documents without leaving editor
- **Measurement**: Session recordings show no tab/app switching during uploads

**Usability Goal**: Minimal learning curve
- **Metric**: User creates first report and uploads first document in < 5 minutes (no tutorial)
- **Measurement**: User testing with 5 target users

### Technical Success Metrics

**Reliability**:
- Uptime: 100% (local development, no external dependencies beyond LlamaParse)
- Data persistence: Zero data loss on server restart
- File integrity: 100% of uploaded files retrievable

**Performance**:
- Report list load: < 500ms (50 reports)
- Document upload: < 5 seconds (5MB file, excluding parse time)
- Search response: < 100ms (100 documents)
- Auto-save: < 200ms (no user-perceived lag)

**Quality**:
- Zero critical bugs blocking core workflows (create report, upload document, search)
- LlamaParse success rate: > 95% (for supported file types)

---

## 8. Dependencies & Risks

### External Dependencies
- **LlamaParse API**: Requires API key, subject to quota and pricing
  - **Risk**: API downtime prevents parsing
  - **Mitigation**: Store original file, allow viewing even if parse fails

- **OAuth Providers (Google, LinkedIn)**: Requires developer credentials
  - **Risk**: OAuth credential issues block authentication
  - **Mitigation**: Magic link as fallback authentication method

- **Email Service (Magic Link)**: Requires SMTP or service API
  - **Risk**: Email delivery failures prevent login
  - **Mitigation**: Social login as primary method, magic link as secondary

### Technical Risks
- **File Storage**: Local filesystem could run out of space
  - **Mitigation**: Set file size limits (25MB per file, 500 files per report)

- **Database Growth**: SQLite performance degrades with large datasets
  - **Mitigation**: Use PostgreSQL if local database grows beyond 1000 reports

- **Browser Compatibility**: Markdown editor may not work in older browsers
  - **Mitigation**: Require modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

---

## 9. Glossary

**Report**: The primary deliverable the user is writing (e.g., research report, analysis). Contains markdown content and references to uploaded documents.

**Document**: A reference file uploaded by the user (e.g., earnings report, regulatory filing). Stored as original file + parsed markdown.

**Document Tags**: Labels applied to documents within a report (report-scoped). Used for filtering and organization.

**Report Tags**: Labels applied to reports (global scope). Used to categorize and filter reports.

**Parsed Content**: Markdown extracted from uploaded files via LlamaParse API.

**Magic Link**: Email-based authentication link (one-time use, time-limited).

**Duplicate Detection**: Mechanism to prevent uploading identical files to the same report (filename + hash check).

**Auto-save**: Automatic saving of report content every 30 seconds.

---

## 10. Open Questions

1. **Email Service Selection**: Which email service for magic links? (Resend, SendGrid, AWS SES, or local SMTP for dev)
   - **Decision Needed By**: Before authentication implementation

2. **Markdown Editor Library**: Which editor component? (React Markdown Editor, SimpleMDE, CodeMirror, Monaco?)
   - **Decision Needed By**: Before UI implementation

3. **Database Choice**: SQLite or PostgreSQL for local development?
   - **Decision Needed By**: Before schema design

4. **OAuth Redirect URLs**: Localhost URLs for OAuth callbacks - need separate Google/LinkedIn apps for dev?
   - **Decision Needed By**: Before authentication setup

5. **LlamaParse Quota**: Free tier sufficient for development testing?
   - **Decision Needed By**: Before upload implementation

6. **File Hash Algorithm**: MD5 or SHA-256 for duplicate detection? (MD5 faster, SHA-256 more secure)
   - **Decision Needed By**: Before upload implementation

---

## 11. Appendix: User Stories

### Epic 1: Report Management
- US-1.1: As a user, I can create a new report so that I can start writing
- US-1.2: As a user, I can edit report content using Markdown so that I can write my analysis
- US-1.3: As a user, I can view all my reports so that I can find previous work
- US-1.4: As a user, I can delete a report so that I can remove outdated work
- US-1.5: As a user, I can search reports by name so that I can quickly find specific reports
- US-1.6: As a user, I can add tags to reports so that I can organize by project/client

### Epic 2: Document Upload
- US-2.1: As a user, I can upload TXT/MD files to a report so that I can reference them while writing
- US-2.2: As a user, I can drag-and-drop files so that uploading is fast
- US-2.3: As a user, I see upload progress so that I know files are being processed
- US-2.4: As a user, I am warned about duplicate files so that I don't upload the same file twice
- US-2.5: As a user, uploaded files are automatically parsed so that I can search their content (NEXT phase)

### Epic 3: Document Management
- US-3.1: As a user, I can view all documents in a report so that I can see my references
- US-3.2: As a user, I can search documents by filename so that I can quickly find specific files
- US-3.3: As a user, I can click a document to view its content so that I can reference it
- US-3.4: As a user, I can add notes to documents so that I can capture context
- US-3.5: As a user, I can tag documents so that I can categorize them
- US-3.6: As a user, I can rename documents so that filenames are meaningful
- US-3.7: As a user, I can delete documents so that I can remove irrelevant files

### Epic 4: Authentication
- US-4.1: As a user, I can sign in with Google so that I can access my reports
- US-4.2: As a user, I can sign in with LinkedIn so that I can access my reports
- US-4.3: As a user, I can sign in via magic link email so that I don't need to remember a password
- US-4.4: As a user, I can sign out so that my data is secure
- US-4.5: As a user, I stay logged in for 30 days so that I don't need to re-authenticate constantly

---

**END OF PRD-NOW (Core MVP)**
