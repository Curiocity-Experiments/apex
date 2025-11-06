# Continuation Prompt for Apex Rebuild

This prompt allows you to pick up the Apex rebuild work in a fresh context.

---

## Copy This Prompt to Claude Code

```
I'm restarting the build of Apex (formerly Curiocity) within the current repository following clean architecture principles.

## Context

**Current Branch**: claude/rebuild-vs-refactor-decision-011CUqe8pbbHB8Y4TkPDBStL (or main)
**Repository**: /home/user/apex
**Status**: Planning complete, ready to execute restart

## What's Been Done

1. ✅ Created comprehensive PRDs (NOW/NEXT/LATER phases)
2. ✅ Made all technical decisions (15 key choices documented)
3. ✅ Designed architecture (clean 5-layer architecture with service/repository pattern)
4. ✅ Defined database schema (PostgreSQL with Prisma)
5. ✅ Created API design (30+ endpoints)
6. ✅ Wrote developer implementation guide (7 phases, 40-60 hours)
7. ✅ Analyzed legacy codebase for useful patterns
8. ✅ Documented restart plan

## Available Documentation

All documentation is in the `docs/` directory:

- **docs/prd/** - Product Requirements (NOW/NEXT/LATER)
  - PRD-NOW-Core-MVP.md
  - PRD-NEXT-Enhanced-Features.md
  - PRD-LATER-Advanced-Features.md
  - PRD-SUMMARY.md
  - TECHNICAL-DECISIONS.md

- **docs/technical specs** - Architecture & Implementation
  - TECHNICAL-SPECIFICATION.md (master document)
  - ARCHITECTURE.md (5-layer clean architecture)
  - DATABASE-SCHEMA.md (PostgreSQL schema)
  - DATABASE-QUICKSTART.md (Prisma setup)
  - specs/API-DESIGN.md (30+ endpoints)
  - technical-spec/component-structure.md (file structure)

- **docs/implementation** - Execution Plans
  - DEVELOPER-GUIDE.md (7-phase implementation, 40-60 hours)
  - RESTART-PLAN.md (step-by-step restart instructions)
  - REFERENCE-FROM-LEGACY.md (patterns to reference from old code)

## My Goal

**Execute the restart plan** to archive the old Curiocity code and start building Apex cleanly.

## Instructions

Please execute the restart plan from `docs/RESTART-PLAN.md` following these principles:

1. **Simple over complicated** - Use git tag for legacy reference, NO _legacy/ directory
2. **Trunk-based development** - Work on main branch, no long-lived feature branches
3. **Frequent merges** - Already on main, commit frequently after each component
4. **Tag for reference** - Old code accessible via `git tag legacy-curiocity`

## Execution Plan Summary

The restart plan has 6 phases:

**Phase A**: Tag current state as `legacy-curiocity` (permanent git reference)
**Phase B**: Switch to main branch (trunk-based development)
**Phase C**: Clean workspace (delete old code, keep docs)
**Phase D**: Initialize fresh Apex project (package.json, Prisma, directory structure)
**Phase E**: First commit to main (Phase 0 complete)
**Phase F**: Begin Phase 1 development (follow Developer Guide)

## What I Need

Please **read and execute** the restart plan step-by-step:

1. Read `docs/RESTART-PLAN.md` to understand the full plan
2. Complete the pre-execution checklist
3. Execute Phase A (tag current state)
4. Execute Phase B (switch to main)
5. Execute Phase C (clean workspace)
6. Execute Phase D (initialize fresh Apex project - this is the longest phase with 11 steps)
7. Execute Phase E (commit Phase 0 to main)
8. Prepare for Phase F (reference Developer Guide for Phase 1)

After Phase E is complete, I'll be ready to start building features following the Developer Guide.

## Key Files to Reference

- `docs/RESTART-PLAN.md` - Primary execution guide (start here)
- `docs/DEVELOPER-GUIDE.md` - Implementation guide for Phases 1-7
- `docs/REFERENCE-FROM-LEGACY.md` - Legacy patterns to reference
- `docs/TECHNICAL-SPECIFICATION.md` - Architecture overview

## Development Approach

- **Stack**: Next.js 14, React 18, TypeScript, PostgreSQL, Prisma, NextAuth
- **Architecture**: Clean 5-layer (Presentation → Application → Domain → Infrastructure → External)
- **Patterns**: Service layer, Repository pattern, Dependency injection
- **State**: React Query (server), Zustand (client), React Hook Form (forms)

## Git Strategy

- **Main branch**: Always deployable
- **Commits**: Small, atomic, after each component
- **Tag**: `legacy-curiocity` for referencing old code
- **Merge frequency**: After each phase (already on main)

## Success Criteria

After executing the restart plan, I should have:

✅ Git tag `legacy-curiocity` created and pushed
✅ Main branch is active
✅ Legacy code removed from working directory
✅ Fresh Apex project initialized:
   - package.json with clean dependencies
   - Prisma schema and migrations
   - Directory structure per Developer Guide
   - PostgreSQL running in Docker
   - Minimal Next.js pages working
✅ Phase 0 committed to main
✅ Ready to start Phase 1 (core infrastructure)

## Notes

- The old Curiocity code had serious architectural issues (God objects, tight coupling, no service layer)
- Apex fixes these with clean architecture, proper separation of concerns, and modern patterns
- All planning is complete; now it's time to build
- Reference legacy code via git tag when needed (especially for working integrations like NextAuth, LlamaParse, S3)

Please proceed with executing the restart plan!
```

---

## How to Use This Prompt

1. **Copy everything** between the triple backticks above
2. **Paste into Claude Code** in a new conversation
3. Claude will have full context to execute the restart plan
4. The plan is already documented, just needs execution

---

## What Gets Preserved

When you use this prompt in a new context:

✅ **All documentation** in docs/ directory
✅ **Git tag** with complete legacy code
✅ **Clear instructions** for each phase
✅ **Reference guides** for useful patterns
✅ **Full architecture** and implementation plans

---

## Alternative: Shorter Quick Start Prompt

If you just want to start Phase A immediately without full context:

```
Execute the Apex restart plan from docs/RESTART-PLAN.md starting with Phase A (tag current state).

The plan archives the old Curiocity code via git tag and starts building Apex cleanly.

Follow trunk-based development: work on main, commit frequently, use git tag legacy-curiocity for legacy reference.

Start with Phase A now.
```

---

## After Restart Complete

Once Phases A-E are done, use this prompt for Phase 1:

```
Continue building Apex following docs/DEVELOPER-GUIDE.md starting with Phase 1: Core Infrastructure.

Phase 0 is complete (fresh project initialized).

Implement Phase 1 components:
- Domain entities (Report, Document, Tag)
- Repository interfaces
- Prisma repository implementations
- Unit tests

Reference docs/ARCHITECTURE.md for patterns and docs/REFERENCE-FROM-LEGACY.md for working implementations.
```

---

## Troubleshooting

If context is unclear:
1. Read docs/RESTART-PLAN.md
2. Check current git branch
3. Verify PostgreSQL is running
4. Check docs/DEVELOPER-GUIDE.md for next steps

If restart fails:
1. See "Rollback Plan" in docs/RESTART-PLAN.md
2. Git tag can restore old code
3. Can re-run any phase from plan
