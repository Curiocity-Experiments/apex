# Product Requirements Document: Apex Advanced Features

**Phase**: LATER (Collaboration, Mobile, Advanced Features)
**Status**: Draft v1.0
**Date**: 2025-11-06
**Prerequisites**: NEXT phase complete, user base established (50+ active users)

---

## 1. Executive Summary

### What We're Building
Advanced features transforming Apex from single-user tool to collaborative research platform with mobile support, team features, and enhanced productivity capabilities.

### Why This Phase
**NEXT Phase Learnings** (assumptions to validate):
- Users requested: "I want to share reports with my team"
- Users requested: "I need to view reports on my iPad while traveling"
- Users requested: "I want to export my report as PDF to send to clients"
- Users requested: "I wish I could see what changed in my report last week"

**LATER Phase Goals**:
1. **Collaboration**: Enable team research (share reports, co-edit, comment)
2. **Mobile**: View-only access on tablets and phones
3. **Productivity**: Export, version history, advanced search
4. **Media**: Audio/video file support for earnings calls and presentations

### Success Metrics
- **Team Adoption**: 30%+ of users create at least one shared report
- **Mobile Usage**: 15%+ of sessions from mobile devices (tablets + phones)
- **Export Usage**: 40%+ of reports exported at least once
- **Collaboration**: 20%+ of users have collaborated on a shared report
- **Retention**: 70%+ monthly active users (MAU)

---

## 2. Changes from NEXT Phase

### New Capabilities
1. **Team Collaboration**: Share reports, real-time co-editing, comments
2. **Mobile Responsive**: View reports on tablets (iPad, Android) and phones (read-only)
3. **Export**: Download reports as PDF, Word, or Markdown
4. **Version History**: Track changes to reports over time
5. **Advanced File Types**: Audio (MP3, M4A, WAV), Video (MP4, MOV)
6. **Enhanced Search**: Fuzzy search, autocomplete, advanced filters
7. **Global Tags**: Tags shared across reports (autocomplete from user's tag library)
8. **Keyboard Shortcuts**: Power-user productivity shortcuts
9. **Dark Mode**: Reduce eye strain for long writing sessions
10. **API Access**: Programmatic access for power users (export data, automation)

### Unchanged from NEXT
- WYSIWYG rich text editor
- LlamaParse for document parsing
- Cloudflare R2 / Supabase Storage
- PostHog analytics
- Desktop-first design (mobile is graceful degradation)

---

## 3. Advanced Features (WHAT + WHY)

### 3.1 Team Collaboration

**What**: Share reports with team members, real-time co-editing, commenting

**Why**:
- **User Request**: "My analyst team works on reports together - we email drafts back and forth (painful!)"
- **Workflow**: Research reports often involve multiple contributors (data analyst, writer, reviewer)
- **Efficiency**: Real-time collaboration eliminates "merging edits from 3 Word docs"

**Capabilities**:

#### Share Reports
- **Share via Email**: Invite collaborators by email address
- **Permission Levels**:
  - **Owner**: Full control (edit, delete, manage permissions)
  - **Editor**: Edit report and documents (cannot delete or change permissions)
  - **Viewer**: Read-only access (cannot edit)
- **Share Link**: Generate public link (view-only, optional expiration)

#### Real-Time Co-Editing
- **Simultaneous Editing**: Multiple users edit same report simultaneously
- **Presence Indicators**: See who else is viewing/editing (colored cursor avatars)
- **Conflict Resolution**: Operational Transform (OT) or CRDT for merging edits
- **Auto-Sync**: Changes sync every 2-3 seconds

#### Commenting
- **Inline Comments**: Highlight text, add comment (like Google Docs)
- **Comment Threads**: Reply to comments, resolve when addressed
- **Mentions**: @mention team members (sends notification)
- **Document Comments**: Comment on uploaded documents

**User Workflows**:

**Workflow: Share Report with Team**
1. Sarah clicks "Share" button in report editor
2. Modal: "Invite collaborators"
3. Enters emails: "analyst@company.com, reviewer@company.com"
4. Sets permissions: "Editor" for analyst, "Viewer" for reviewer
5. Clicks "Send Invites"
6. Team members receive email: "Sarah invited you to collaborate on 'Q4 Tech Analysis'"
7. They click link → automatically added to report (if they have account) or prompted to sign up

**Workflow: Co-Edit Report**
1. Sarah and analyst both open same report
2. Sarah sees analyst's avatar in top-right: "👤 John (editing)"
3. Analyst typing in paragraph 3 → Sarah sees typing indicator
4. Sarah edits paragraph 5 simultaneously → no conflict
5. Analyst adds comment on paragraph 1: "Need to update this data"
6. Sarah receives notification: "John commented on 'Q4 Tech Analysis'"
7. Sarah clicks notification → jumps to comment
8. Sarah replies: "Updated!" → marks comment as resolved

**Acceptance Criteria**:
- Can invite unlimited collaborators per report
- Permission changes take effect immediately
- Co-editing works without conflicts (no "edit collision" errors)
- See collaborator cursors in real-time (< 500ms latency)
- Comments display in sidebar with threading
- Email notifications for mentions and new comments

**Technical Requirements**:
- **Real-Time Sync**: WebSockets or Server-Sent Events (SSE)
- **Conflict Resolution**: Use Yjs (CRDT library) or Automerge
- **Presence**: Track active users per report (Redis or database)
- **Permissions**: Database schema for sharing (report_collaborators table)

---

### 3.2 Mobile Responsive Design

**What**: Optimized view for tablets and phones (read-only initially)

**Why**:
- **User Request**: "I travel for client meetings - want to review reports on my iPad"
- **Use Case**: Executives review reports on mobile, but don't need to edit
- **Graceful Degradation**: NEXT phase desktop-only → LATER adds mobile viewing

**Capabilities**:

#### Tablet (iPad, Android Tablets)
- **View Reports**: Read reports in optimized layout
- **View Documents**: Preview PDFs, images, text files
- **Search**: Find documents by filename or content (same as desktop)
- **Navigate**: Swipe gestures for navigation
- **Editing**: LIMITED - Can edit in simplified editor (no toolbar, markdown shortcuts)

#### Phone (iPhone, Android Phones)
- **View Reports**: Read-only mode
- **View Documents**: Scrollable document list, tap to view
- **Search**: Search bar at top
- **No Editing**: Redirect to desktop for editing (show message: "Edit on desktop")

**Responsive Breakpoints**:
- **Desktop**: 1280px+ (full editor, two-panel layout)
- **Tablet**: 768px - 1279px (single-panel layout, swipe to switch panels)
- **Phone**: < 768px (read-only, simplified navigation)

**User Workflows**:

**Workflow: Review Report on iPad**
1. Sarah opens Apex on iPad
2. Sees report list (card grid, 2 columns)
3. Taps "Q4 Tech Analysis" report
4. Report opens in single-panel view (editor fills screen)
5. Swipes left → Document panel slides in from right
6. Taps document "earnings-meta.pdf" → PDF preview opens full-screen
7. Pinch-to-zoom on PDF
8. Swipes right → Returns to report editor
9. Taps "Share" → Share modal (can invite collaborators from iPad)

**Workflow: Quick Check on Phone**
1. Sarah receives notification: "John commented on 'Q4 Tech Analysis'"
2. Opens link on phone (iPhone)
3. Report loads in read-only mode
4. Scrolls to comment → reads: "Need to update revenue chart"
5. Taps "Reply" → Sees message: "Editing is available on desktop"
6. Instead, taps "👍" reaction on comment (quick acknowledgment)
7. Closes app, will address on desktop later

**Acceptance Criteria**:
- Tablet: Can view and navigate reports, search documents, edit in simplified mode
- Phone: Can view reports and documents, search, but no editing
- Touch gestures work smoothly (swipe, pinch-zoom, tap)
- Font sizes readable on small screens (16px minimum)
- No horizontal scrolling (responsive layout)

**Technical Requirements**:
- Tailwind CSS breakpoints for responsive design
- Touch-friendly UI (44px minimum touch targets)
- Progressive Web App (PWA) support for install-to-home-screen
- Offline mode: Cache last 5 viewed reports for offline reading

---

### 3.3 Export Reports

**What**: Download reports as PDF, Word, or Markdown

**Why**:
- **User Request**: "I finish reports in Apex, then need to send to clients as PDF"
- **Workflow**: Research reports often shared externally (clients, stakeholders)
- **Formats Needed**:
  - **PDF**: Final deliverable (clients, email attachments)
  - **Word**: Client prefers editing in Word
  - **Markdown**: Backup / version control (GitHub)

**Export Formats**:

#### PDF Export
- **Layout**: Professional formatting (margins, headers, footers)
- **Styling**: Preserve formatting (headers, tables, images)
- **Options**:
  - Include/exclude table of contents
  - Include/exclude document list (appendix)
  - Custom footer text (e.g., "Confidential - Client XYZ")

#### Word Export (.docx)
- **Compatibility**: Microsoft Word 2016+ format
- **Styling**: Preserve formatting (convert Tiptap to Word styles)
- **Editable**: Recipient can edit in Word

#### Markdown Export (.md)
- **Format**: GitHub Flavored Markdown
- **Use Case**: Backup, version control, plain text archive

**User Workflows**:

**Workflow: Export Report as PDF**
1. Sarah finishes Q4 report
2. Clicks "Export" button in toolbar
3. Modal: "Export Report"
   - Format: PDF (dropdown)
   - Options: ☑ Include table of contents, ☐ Include document appendix
   - Footer: "Confidential - ACME Corp Analysis"
4. Clicks "Export"
5. Loading: "Generating PDF..." (5-10 seconds for 20-page report)
6. PDF downloads: "Q4-2024-Tech-Analysis.pdf"
7. Sarah opens PDF → professionally formatted, ready to send to client

**Acceptance Criteria**:
- PDF export completes in < 30 seconds for 50-page report
- Formatting preserved (headers, tables, images)
- PDF includes clickable table of contents (if enabled)
- Word export opens correctly in Microsoft Word
- Markdown export uses GitHub Flavored Markdown syntax

**Technical Requirements**:
- **PDF Generation**: Use Puppeteer (headless Chrome) or pdfkit
- **Word Generation**: Use docx library or pandoc
- **Server-Side**: Generate exports server-side (Next.js API route)
- **Rate Limiting**: Max 5 exports per hour per user (prevent abuse)

---

### 3.4 Version History

**What**: Track changes to reports over time, restore previous versions

**Why**:
- **User Request**: "I deleted a paragraph by mistake - can I undo?"
- **Safety Net**: Users feel safe experimenting, knowing they can revert
- **Audit Trail**: See who changed what and when (for collaborative reports)

**Capabilities**:

#### Version Tracking
- **Auto-Save Versions**: Create version snapshot every 10 minutes (if changes made)
- **Manual Versions**: User can manually save version with label (e.g., "Draft for review")
- **Version List**: Show list of versions with timestamps and authors
- **Diff View**: Show changes between versions (added/removed text highlighted)

#### Restore Versions
- **Preview**: View old version without restoring
- **Restore**: Revert report to previous version (creates new version, doesn't delete history)

**User Workflows**:

**Workflow: Restore Accidentally Deleted Content**
1. Sarah editing report, accidentally deletes entire section 3
2. Realizes mistake 10 minutes later (auto-saved in meantime)
3. Clicks "Version History" button
4. Sidebar opens showing versions:
   - "10 minutes ago - Sarah (current)"
   - "20 minutes ago - Sarah"
   - "1 hour ago - John"
5. Clicks "20 minutes ago" → Preview loads
6. Sees section 3 still present in old version
7. Clicks "Restore this version"
8. Confirmation: "This will restore the report to 20 minutes ago. Continue?"
9. Clicks "Restore"
10. Section 3 reappears (new version created: "Restored from 20 minutes ago")

**Acceptance Criteria**:
- Version created every 10 minutes (if changes made)
- Version list shows last 50 versions
- Diff view highlights added (green) and removed (red) text
- Restore completes instantly (< 1 second)
- Version history works for collaborative reports (shows all authors)

**Technical Requirements**:
- **Storage**: Store versions as JSONB in PostgreSQL (report_versions table)
- **Diff Algorithm**: Use diff-match-patch library
- **Retention**: Keep versions for 90 days (delete older versions to save space)

---

### 3.5 Audio & Video File Support

**What**: Upload and reference audio/video files (earnings calls, presentations)

**Why**:
- **User Request**: "Earnings calls are on MP3 - I want to reference specific timestamps"
- **Use Case**: Financial analysts listen to earnings calls, watch investor presentations
- **Formats**:
  - **Audio**: MP3, M4A, WAV (earnings calls, podcasts, interviews)
  - **Video**: MP4, MOV (presentations, webinars)

**Capabilities**:

#### Audio Files
- **Player**: Embedded audio player with play/pause, seek, speed control
- **Transcription**: Use LlamaParse or OpenAI Whisper to transcribe audio → searchable text
- **Timestamps**: Add timestamped notes (e.g., "3:45 - CEO mentions supply chain")
- **Waveform**: Visual waveform display for easy seeking

#### Video Files
- **Player**: Embedded video player with play/pause, seek, fullscreen
- **Transcription**: Same as audio (extract audio track, transcribe)
- **Thumbnails**: Generate thumbnail preview
- **Chapters**: Add chapter markers with labels

**User Workflows**:

**Workflow: Upload Earnings Call Audio**
1. Sarah downloads Meta Q3 earnings call (MP3, 45 minutes, 30MB)
2. Drags MP3 into report
3. Upload completes → LlamaParse transcribes audio (takes 5 minutes)
4. Audio player appears in document viewer
5. Sarah listens to call, finds key quote at 12:30
6. Clicks "Add Timestamp Note" at 12:30
7. Types: "CFO: 'We expect margins to expand 2-3% in Q4'"
8. Continues listening, adds 5 more timestamp notes
9. Later: Searches "margin expand" → finds audio file with timestamp note
10. Clicks result → jumps to 12:30 in audio

**Acceptance Criteria**:
- Audio/video files upload successfully (max 500MB)
- Transcription completes in < 10 minutes for 1-hour audio
- Audio player supports 1.5x and 2x playback speed
- Video player works on all desktop browsers
- Timestamp notes searchable via full-text search

**Technical Requirements**:
- **Transcription**: OpenAI Whisper API or AssemblyAI
- **Player**: Use HTML5 audio/video elements or Video.js library
- **Storage**: Store files in Cloudflare R2 (same as PDFs)
- **Streaming**: Use signed URLs with HTTP range requests for seeking

---

### 3.6 Advanced Search (Fuzzy, Autocomplete, Filters)

**What**: Enhanced search with fuzzy matching, autocomplete, and advanced filters

**Why**:
- **NEXT Phase Limitation**: Exact match search only (typos break search)
- **User Need**: "I searched 'anaylsis' (typo) and got no results, but document exists"
- **Power User Feature**: Analysts work with hundreds of documents, need powerful search

**Capabilities**:

#### Fuzzy Search
- **Typo Tolerance**: "anaylsis" matches "analysis"
- **Partial Match**: "techno" matches "technology"
- **Phonetic Match**: "metuh" matches "meta"

#### Autocomplete
- **Suggested Queries**: Show common searches as user types
- **Recent Searches**: Show last 5 searches (per user)
- **Popular Tags**: Autocomplete tags from user's tag library

#### Advanced Filters
- **Combine Filters**:
  - File type (PDF, Word, Excel, etc.)
  - Date range (uploaded between X and Y)
  - File size (< 5MB, > 50MB)
  - Tags (multiple tags, AND/OR logic)
- **Save Filters**: Save common filter combinations (e.g., "PDFs from last month")

**User Workflows**:

**Workflow: Search with Typo**
1. Sarah searches: "anaylsis" (typo)
2. Results show: "Did you mean: analysis?" with fuzzy matches
3. Shows 3 documents containing "analysis"
4. Sarah clicks first result → found what she needed despite typo

**Workflow: Use Advanced Filters**
1. Sarah has 200 documents across 10 reports
2. Needs to find: "PDFs uploaded in last 7 days with tag 'financial-data'"
3. Clicks "Advanced Search"
4. Filter panel opens:
   - File type: ☑ PDF
   - Date range: "Last 7 days" (quick select)
   - Tags: "financial-data" (autocomplete)
5. Clicks "Apply Filters"
6. Results: 4 PDFs matching criteria
7. Clicks "Save Filter" → Names it "Recent Financial PDFs"
8. Next time: Clicks saved filter → instant results

**Acceptance Criteria**:
- Fuzzy search handles 1-2 character typos
- Autocomplete shows suggestions in < 100ms
- Advanced filters update results in < 500ms
- Can combine up to 5 filters simultaneously
- Saved filters persist across sessions

**Technical Requirements**:
- **Search Engine**: Upgrade from PostgreSQL to Typesense or Meilisearch (dedicated search engine)
- **Fuzzy Match**: Use Levenshtein distance algorithm
- **Autocomplete**: Index common terms, use trie data structure
- **Performance**: Search 10,000+ documents in < 500ms

---

### 3.7 Global Tags

**What**: Tags shared across all reports (autocomplete from user's tag library)

**Why**:
- **NEXT Phase Limitation**: Tags scoped per report → user types same tags repeatedly
- **User Need**: Consistency across reports (use "q4-2024" tag on all Q4 reports)
- **Autocomplete**: Suggest existing tags → faster tagging, consistent naming

**Capabilities**:

#### Global Tag Library
- **Scope**: All tags user has ever created (across all reports)
- **Autocomplete**: Type tag name → suggests from library
- **Tag Management**: View all tags, rename, merge duplicates
- **Usage Count**: Show how many documents/reports use each tag

#### Tag Suggestions
- **Smart Suggestions**: Suggest tags based on report content
  - Example: Report mentions "Q4 2024" → suggests tag "q4-2024"
- **Related Tags**: Show related tags (e.g., typing "finance" suggests "financial-data", "financials")

**User Workflows**:

**Workflow: Tag with Autocomplete**
1. Sarah uploading earnings report to new project
2. Types tag: "fin..." → Autocomplete shows:
   - "financial-data" (used 25 times)
   - "financials" (used 12 times)
   - "finance" (used 8 times)
3. Selects "financial-data" (consistent with past usage)
4. Types "q4..." → Autocomplete shows "q4-2024" (used 15 times)
5. Tags applied instantly, consistent with previous reports

**Workflow: Manage Tags**
1. Sarah clicks "Settings" → "Manage Tags"
2. Sees list of all tags:
   - "financial-data" (used in 25 documents)
   - "financials" (used in 12 documents)
   - "q4-2024" (used in 15 documents)
3. Realizes "financials" is duplicate of "financial-data"
4. Selects "financials" → Clicks "Merge into..." → Selects "financial-data"
5. Confirmation: "Merge 'financials' into 'financial-data'? This will update 12 documents."
6. Clicks "Merge"
7. Now has single tag: "financial-data" (used in 37 documents)

**Acceptance Criteria**:
- Autocomplete shows top 5 matching tags
- Tag library accessible from settings page
- Can rename tag (updates all documents using that tag)
- Can merge tags (combines usage counts)
- Tag suggestions appear based on document content

---

### 3.8 Keyboard Shortcuts

**What**: Productivity shortcuts for power users

**Why**:
- **Power User Feature**: Analysts spend hours in app → shortcuts save time
- **Common Actions**: Create report, upload document, search, format text

**Shortcuts**:

**Global**:
- `Cmd/Ctrl + K`: Quick search (focus search box)
- `Cmd/Ctrl + N`: New report
- `Cmd/Ctrl + U`: Upload document
- `Cmd/Ctrl + ,`: Open settings
- `Esc`: Close modal/panel

**Editor**:
- `Cmd/Ctrl + B`: Bold
- `Cmd/Ctrl + I`: Italic
- `Cmd/Ctrl + K`: Insert link
- `Cmd/Ctrl + Shift + L`: Bulleted list
- `Cmd/Ctrl + Shift + O`: Numbered list
- `Cmd/Ctrl + Shift + C`: Code block
- `Cmd/Ctrl + Alt + 1-3`: Heading 1-3

**Navigation**:
- `Cmd/Ctrl + \`: Toggle document panel
- `Cmd/Ctrl + [`: Previous report
- `Cmd/Ctrl + ]`: Next report
- `/`: Focus search (from anywhere)

**Acceptance Criteria**:
- All shortcuts work on Mac (Cmd) and Windows/Linux (Ctrl)
- Shortcuts shown in tooltips (hover over buttons)
- Shortcut help modal: `Cmd/Ctrl + /` shows all shortcuts
- Shortcuts don't conflict with browser defaults

---

### 3.9 Dark Mode

**What**: Dark color scheme for reduced eye strain

**Why**:
- **User Request**: "I write reports late at night - bright screen hurts my eyes"
- **Standard Feature**: Most productivity tools offer dark mode (Notion, Google Docs)
- **Preference**: Auto-detect system preference, manual toggle

**Implementation**:
- **Auto-Detect**: Use system preference (prefers-color-scheme: dark)
- **Manual Toggle**: Switch in settings or navbar (sun/moon icon)
- **Persistence**: Remember user's choice (localStorage)

**Dark Mode Colors**:
- Background: `#1a1a1a`
- Text: `#e0e0e0`
- Panels: `#2a2a2a`
- Borders: `#3a3a3a`
- Accent: `#4a9eff` (blue)

**Acceptance Criteria**:
- Dark mode applies to entire app (editor, document viewer, modals)
- Syntax highlighting works in dark mode (readable colors)
- Toggle switches instantly (no page refresh)
- User preference persists across sessions

---

### 3.10 API Access

**What**: REST API for programmatic access to reports and documents

**Why**:
- **Power User Feature**: Analysts want to automate workflows (export all reports weekly)
- **Integrations**: Connect Apex to other tools (Zapier, n8n)
- **Use Cases**:
  - Bulk export reports
  - Automated backups
  - Integrate with internal tools

**API Endpoints**:

**Authentication**:
- `POST /api/v1/auth/token`: Get API token (JWT)

**Reports**:
- `GET /api/v1/reports`: List all reports
- `GET /api/v1/reports/:id`: Get report details
- `POST /api/v1/reports`: Create report
- `PUT /api/v1/reports/:id`: Update report
- `DELETE /api/v1/reports/:id`: Delete report
- `GET /api/v1/reports/:id/export`: Export report (PDF, Word, Markdown)

**Documents**:
- `GET /api/v1/reports/:reportId/documents`: List documents in report
- `GET /api/v1/documents/:id`: Get document details
- `POST /api/v1/documents`: Upload document
- `DELETE /api/v1/documents/:id`: Delete document

**Search**:
- `GET /api/v1/search?q=keyword`: Search across reports and documents

**Rate Limiting**:
- 100 requests per minute per user
- 1000 requests per hour per user

**Acceptance Criteria**:
- API follows REST conventions
- All endpoints require authentication (API token in header)
- API documentation (OpenAPI/Swagger spec)
- Rate limiting enforced (return 429 if exceeded)

---

## 4. Technical Architecture (LATER Phase)

### Real-Time Collaboration (Yjs + WebSockets)

**Stack**:
- **CRDT Library**: Yjs (conflict-free replicated data types)
- **Transport**: WebSockets (Socket.IO or native WebSockets)
- **Server**: Node.js WebSocket server (separate from Next.js)
- **Persistence**: Yjs documents stored in PostgreSQL

**Architecture**:
```
Client 1 (Browser)
  ↕ WebSocket
Server (Yjs Sync Server)
  ↕ WebSocket
Client 2 (Browser)

Server ↔ PostgreSQL (persist Yjs doc)
```

**Acceptance Criteria**:
- Edits sync in < 500ms (local network)
- No edit conflicts (Yjs handles merging)
- Presence indicators show collaborators in real-time

---

### Mobile Responsive (Tailwind Breakpoints)

**Breakpoints**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Phone
      'md': '768px',   // Tablet
      'lg': '1024px',  // Laptop
      'xl': '1280px',  // Desktop
      '2xl': '1536px', // Large desktop
    }
  }
}
```

**Responsive Patterns**:
- Desktop: Two-panel layout (editor | documents)
- Tablet: Single-panel, swipeable
- Phone: Read-only, simplified navigation

---

### Advanced Search (Typesense)

**Why Typesense**:
- Faster than PostgreSQL for full-text search (< 100ms for 100,000 documents)
- Built-in fuzzy search, autocomplete, faceted filters
- Simple deployment (single Docker container)

**Indexing**:
```javascript
// Index documents in Typesense
typesense.collections('documents').documents().create({
  id: document.id,
  filename: document.filename,
  content: document.parsed_content,
  tags: document.tags,
  report_id: document.report_id,
  created_at: document.created_at,
});
```

**Search Query**:
```javascript
// Fuzzy search with filters
typesense.collections('documents').documents().search({
  q: 'anaylsis',  // Typo
  query_by: 'filename,content,tags',
  filter_by: 'report_id:=123 && tags:=[financial-data]',
  typo_tolerance: 2,  // Allow 2-character typos
  per_page: 20,
});
```

---

## 5. Out of Scope (LATER)

### Features STILL Not in LATER:
- ❌ Multi-language support (internationalization)
- ❌ Advanced permissions (custom roles beyond Owner/Editor/Viewer)
- ❌ Integrations with external tools (Slack, Teams, etc.)
- ❌ AI-powered features (auto-summarization, writing assistance)
- ❌ White-labeling or self-hosted enterprise version
- ❌ Advanced analytics dashboard (usage stats, report analytics)
- ❌ Custom branding (logo, colors) per user/team

---

## 6. Success Criteria (LATER Phase)

### User Success Metrics

**Collaboration**:
- Target: 30%+ of users create at least one shared report
- Target: 20%+ of users collaborate on a report (edit or comment)

**Mobile Usage**:
- Target: 15%+ of sessions from mobile devices
- Target: 50%+ of mobile users return weekly (mobile retention)

**Export Usage**:
- Target: 40%+ of reports exported at least once
- Target: PDF most popular format (> 70% of exports)

**Advanced Features**:
- Target: 20%+ of users try keyboard shortcuts
- Target: 30%+ of users enable dark mode
- Target: 10%+ of users use advanced search filters

**Retention**:
- Target: 70%+ monthly active users (MAU)
- Target: 40%+ users active for 6+ months (long-term retention)

### Technical Success Metrics

**Performance**:
- Real-time sync latency: < 500ms (P95)
- Mobile page load: < 3 seconds (3G network)
- Export generation: < 30 seconds for 50-page PDF
- Search (Typesense): < 100ms (P95)

**Reliability**:
- Uptime: > 99.9%
- Zero data loss in collaborative editing
- WebSocket connection success rate: > 98%

---

## 7. Risks & Mitigation

### Risk 1: Real-Time Sync Complexity
- **Impact**: Bugs in collaborative editing cause data loss
- **Mitigation**: Extensive testing, auto-save fallback (saves every 10 seconds even if sync fails)

### Risk 2: Mobile Performance
- **Impact**: Slow load times on mobile (especially phones)
- **Mitigation**: Lazy load features, optimize bundle size, use service worker for caching

### Risk 3: Search Infrastructure Costs
- **Impact**: Typesense adds $20-50/month hosting cost
- **Mitigation**: Monitor usage, start with smallest instance, scale up as needed

### Risk 4: Audio/Video Transcription Costs
- **Impact**: Transcription costs exceed budget (Whisper API $0.006/minute)
- **Mitigation**: Offer transcription as premium feature, set quota (10 hours/month per user)

---

## 8. Open Questions

1. **Collaboration Pricing**: Free tier or paid-only for team features?
   - **Decision Needed By**: Before collaboration implementation

2. **Mobile App**: Progressive Web App (PWA) or native app (React Native)?
   - **Decision Needed By**: Before mobile development

3. **Transcription Provider**: OpenAI Whisper API vs. AssemblyAI vs. Deepgram?
   - **Decision Needed By**: Before audio/video support

4. **Search Provider**: Self-hosted Typesense vs. managed Algolia?
   - **Decision Needed By**: Before advanced search implementation

5. **API Monetization**: Free API access or paid tier for high-volume users?
   - **Decision Needed By**: Before API launch

---

**END OF PRD-LATER (Advanced Features)**
