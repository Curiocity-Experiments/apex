# ResearchHub Product Requirements - Executive Summary

**Project**: ResearchHub (formerly Curiocity)
**Date**: 2025-11-06
**Status**: Requirements Complete, Ready for Technical Specification

---

## Overview

ResearchHub is a research document management platform that helps financial analysts and knowledge workers organize reference materials while writing long-form reports. The platform solves the core problem of context-switching and time waste when searching for source documents during the writing process.

---

## Three-Phase Development Plan

### **Phase NOW: Core MVP (Local Development)**
**Timeline**: 4-6 weeks
**Goal**: Prove core value proposition with minimal feature set

**Key Features**:
- Report creation and markdown editing
- Document upload (TXT, MD only)
- Filename search
- Document tagging (report-scoped)
- Local file storage
- Social login (Google, LinkedIn) + Magic link email
- LlamaParse integration for text extraction
- Desktop-only (no mobile)

**Success Criteria**:
- User finds documents in < 10 seconds (vs. 5-10 minutes baseline)
- User uploads 5+ documents without context switching
- Zero critical bugs blocking core workflows

**Deployment**: Local development (localhost:3000)

---

### **Phase NEXT: Enhanced Features (Cloud Deployment)**
**Timeline**: 6-8 weeks (after NOW validation)
**Goal**: Production-ready SaaS with expanded capabilities

**Key Features**:
- **Cloud deployment** (Vercel + public URL)
- **Cloud storage** (Cloudflare R2 or Supabase)
- **Expanded file types**: PDF, Word, Excel, PowerPoint, CSV, HTML, images
- **Full-text search** in document content (PostgreSQL)
- **WYSIWYG editor** (Tiptap) for rich formatting
- **Document preview** (in-app PDF viewer, image viewer)
- **Improved duplicate detection** (server-side hash validation)

**Success Criteria**:
- 10+ active users within 30 days
- 3+ reports per user, 15+ documents per report
- 50%+ weekly active users (WAU)
- PDF uploads > 50% of total uploads

**Deployment**: Production cloud (researchhub.app or similar)

---

### **Phase LATER: Advanced Features (Collaboration + Mobile)**
**Timeline**: 8-12 weeks (after NEXT user validation)
**Goal**: Collaborative research platform with mobile support

**Key Features**:
- **Team collaboration**: Share reports, real-time co-editing, commenting
- **Mobile responsive**: View reports on tablets and phones (read-only on phone)
- **Export reports**: PDF, Word, Markdown
- **Version history**: Track changes, restore previous versions
- **Audio/video support**: MP3, MP4 with transcription
- **Advanced search**: Fuzzy search, autocomplete, advanced filters (Typesense)
- **Global tags**: Tag library shared across reports
- **Keyboard shortcuts**: Power-user productivity features
- **Dark mode**: Reduce eye strain
- **API access**: Programmatic access for automation

**Success Criteria**:
- 30%+ users create shared reports
- 15%+ sessions from mobile devices
- 40%+ reports exported
- 70%+ monthly active users (MAU)

**Deployment**: Production with collaboration infrastructure (WebSockets, CRDT)

---

## Core User Persona

**Sarah, Financial Research Analyst**
- **Problem**: Loses train of thought while searching for reference documents during report writing
- **Current Workflow**: Switches between Word/Google Docs and Finder/Explorer 20-50 times per report
- **Job to Be Done**: "When I'm writing a research report and need to reference a source document, I want to instantly access and search my reference materials without leaving my writing environment, so I can maintain flow and finish reports faster."

---

## Key Terminology Changes

| Old (Curiocity) | New (ResearchHub) | Definition |
|-----------------|-------------------|------------|
| Document | Report | The primary deliverable the user is writing (research report, analysis) |
| Resource | Document | A reference file uploaded by the user (earnings report, PDF, etc.) |
| Folder | Tags | Organization method (simplified from actual folders to tags) |

---

## Technical Stack Summary

### NOW Phase
- **Frontend**: Next.js 14, React, Tailwind CSS, Markdown editor
- **Backend**: Next.js API routes
- **Database**: SQLite or PostgreSQL (local)
- **Storage**: Local filesystem
- **Auth**: NextAuth (Google, LinkedIn, Magic Link)
- **Parsing**: LlamaParse API
- **Analytics**: PostHog

### NEXT Phase (Changes from NOW)
- **Hosting**: Vercel (cloud deployment)
- **Database**: PostgreSQL (Supabase, Neon, or PlanetScale)
- **Storage**: Cloudflare R2 or Supabase Storage
- **Editor**: Tiptap (WYSIWYG)
- **Search**: PostgreSQL full-text search

### LATER Phase (Additions to NEXT)
- **Real-Time**: Yjs + WebSockets (collaboration)
- **Search**: Typesense or Meilisearch (advanced search)
- **Transcription**: OpenAI Whisper or AssemblyAI (audio/video)
- **Mobile**: Responsive design + PWA

---

## File Type Support Progression

### NOW Phase
- ✅ TXT (plain text)
- ✅ MD (markdown)

### NEXT Phase (Additions)
- ✅ PDF (most important - 80% of uploads expected)
- ✅ Word (.docx, .doc)
- ✅ Excel (.xlsx, .xls)
- ✅ PowerPoint (.pptx, .ppt)
- ✅ CSV
- ✅ HTML
- ✅ Images (PNG, JPG, GIF)

### LATER Phase (Additions)
- ✅ Audio (MP3, M4A, WAV)
- ✅ Video (MP4, MOV)

---

## Search Capability Progression

### NOW Phase
- **Scope**: Filename only
- **Technology**: Client-side filtering (JavaScript)
- **Speed**: < 100ms

### NEXT Phase
- **Scope**: Filename + document content + notes + tags
- **Technology**: PostgreSQL full-text search
- **Features**: Exact match, snippet preview, highlighting
- **Speed**: < 500ms

### LATER Phase
- **Scope**: Same as NEXT + fuzzy matching
- **Technology**: Typesense or Meilisearch
- **Features**: Typo tolerance, autocomplete, advanced filters
- **Speed**: < 100ms

---

## Editor Progression

### NOW Phase
- **Type**: Markdown editor
- **Features**: Basic markdown syntax (headers, lists, bold, italic, code)
- **Storage**: Plain text (markdown)

### NEXT Phase
- **Type**: WYSIWYG (Tiptap)
- **Features**: Visual formatting, tables, images, links
- **Storage**: JSON or HTML

### LATER Phase
- **Type**: Same as NEXT + collaboration
- **Features**: Real-time co-editing, presence indicators, comments
- **Storage**: Yjs CRDT document

---

## Authentication Methods

### NOW Phase
- **Social Login**: Google OAuth, LinkedIn OAuth
- **Magic Link**: Email-based (no password)
- **Session**: JWT (30-day expiration)

### NEXT Phase
- **Same as NOW** (no changes)

### LATER Phase
- **Additions**: API tokens for programmatic access

---

## Deployment Progression

### NOW Phase
- **Environment**: Local development
- **Access**: localhost:3000
- **Users**: Single developer
- **Data**: Local SQLite or PostgreSQL

### NEXT Phase
- **Environment**: Cloud production (Vercel)
- **Access**: Public URL (e.g., researchhub.app)
- **Users**: 10-50 users
- **Data**: Cloud PostgreSQL + Cloudflare R2

### LATER Phase
- **Environment**: Cloud production (scaled)
- **Access**: Same as NEXT + mobile app (PWA)
- **Users**: 100-1000 users
- **Data**: Same as NEXT + Typesense + WebSocket server

---

## Success Metrics by Phase

### NOW Phase
- **Primary**: Time to find document < 10 seconds (vs. 5-10 min baseline)
- **Primary**: Upload 5+ documents without context switching
- **Secondary**: Create first report + upload first document in < 5 minutes

### NEXT Phase
- **Adoption**: 10+ active users within 30 days
- **Engagement**: 3+ reports per user, 15+ documents per report
- **Retention**: 50%+ weekly active users
- **Feature Usage**: PDF uploads > 50%, full-text search used in 30% of accesses

### LATER Phase
- **Collaboration**: 30%+ users create shared reports
- **Mobile**: 15%+ sessions from mobile
- **Export**: 40%+ reports exported
- **Retention**: 70%+ monthly active users

---

## Key Design Decisions

### Simplifications for NOW
1. **No Folders**: Use tags instead of folder hierarchy (simpler data model)
2. **Limited File Types**: TXT/MD only (prove value before complexity)
3. **Filename Search Only**: Client-side filtering (no search infrastructure)
4. **Desktop Only**: No mobile optimization (target user works on desktop)
5. **Local Storage**: No cloud dependencies (faster development)

### Enhancements for NEXT
1. **Cloud Deployment**: Accessible from anywhere
2. **PDF Support**: Most requested file type (80% of uploads)
3. **Full-Text Search**: Search within document content (10x faster finding)
4. **WYSIWYG Editor**: No markdown learning curve (better UX)
5. **Cloud Storage**: Scalable, durable file storage

### Advanced Features for LATER
1. **Collaboration**: Team research (most requested after MVP)
2. **Mobile**: View reports on iPad during travel
3. **Export**: Send reports to clients as PDF
4. **Version History**: Safety net for mistakes
5. **Audio/Video**: Support earnings calls and presentations

---

## Risk Summary

### NOW Phase Risks
- **LlamaParse API**: Downtime prevents parsing → Mitigation: Store original file, show warning
- **OAuth Setup**: Credential issues block auth → Mitigation: Magic link as fallback

### NEXT Phase Risks
- **Cloud Costs**: Exceed budget → Mitigation: Monitor weekly, set quotas
- **Migration**: Data loss during NOW → NEXT migration → Mitigation: Full backups, test migration
- **Search Performance**: Slow with 10,000+ docs → Mitigation: Add indexes, consider Typesense migration

### LATER Phase Risks
- **Real-Time Sync**: Data loss in collaborative editing → Mitigation: Auto-save fallback every 10 seconds
- **Transcription Costs**: Exceed budget → Mitigation: Offer as premium feature, set quotas

---

## Open Questions (Decisions Needed Before Tech Spec)

### NOW Phase
1. **Database**: SQLite vs. PostgreSQL for local dev?
2. **Markdown Editor**: Which library? (SimpleMDE, CodeMirror, Monaco)
3. **Email Service**: Which provider for magic links? (Resend, SendGrid, local SMTP)

### NEXT Phase
4. **Cloud Database**: Supabase vs. Neon vs. PlanetScale?
5. **File Storage**: Cloudflare R2 vs. Supabase Storage?
6. **File Hash**: MD5 vs. SHA-256 for duplicate detection?

### LATER Phase
7. **Search Engine**: Typesense vs. Meilisearch vs. Algolia?
8. **Transcription**: OpenAI Whisper vs. AssemblyAI vs. Deepgram?
9. **Collaboration Pricing**: Free tier or paid-only for team features?

---

## Next Steps

### ✅ Completed
1. Codebase analysis (NOW + NEXT + LATER features extracted)
2. Business requirements clarification (user interview)
3. Product requirements documents (3 phases)

### 🔄 In Progress
4. **Technical Specification** (next document):
   - Architecture diagrams
   - Database schema (NOW)
   - API design
   - Component structure
   - File organization
   - Technology choices with justifications

### 📋 Upcoming
5. **Developer Implementation Guide**:
   - Step-by-step setup instructions
   - Development workflow
   - Testing strategy
   - Deployment checklist

---

## PRD File Locations

- **NOW**: `/home/user/apex/docs/prd/PRD-NOW-Core-MVP.md` (6,800 words)
- **NEXT**: `/home/user/apex/docs/prd/PRD-NEXT-Enhanced-Features.md` (5,200 words)
- **LATER**: `/home/user/apex/docs/prd/PRD-LATER-Advanced-Features.md` (5,500 words)
- **SUMMARY**: `/home/user/apex/docs/prd/PRD-SUMMARY.md` (this document)

---

## Approval Checklist

Before proceeding to Technical Specification, confirm:

- [ ] NOW phase features align with core use case
- [ ] NEXT phase enhancements are high-value (validated user requests)
- [ ] LATER phase features are not over-scoped
- [ ] Success metrics are measurable
- [ ] Technology choices are appropriate for scale
- [ ] Risks have mitigation strategies
- [ ] Open questions answered (or timeline set for answering)

---

**Document Status**: Ready for Technical Specification
**Next Deliverable**: Technical Specification (Architecture + Database + API + Component Design)
