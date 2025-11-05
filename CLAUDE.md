# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Curiocity is a Next.js application for document and resource management with parsing capabilities. It uses AWS services (DynamoDB, S3) for storage and NextAuth for authentication.

**Tech Stack:** Next.js 14, TypeScript, AWS (DynamoDB + S3), NextAuth, Tailwind CSS

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server with Turbo
npm run build        # Build for production
npm start            # Start production server
```

### Testing and Linting
```bash
npm test             # Run Jest tests
npm run lint         # Run ESLint
```

**Note:** ESLint and TypeScript checks are currently ignored during builds (see `next.config.js`). TypeScript strict mode is enabled but errors don't block builds.

### Code Formatting
```bash
npx prettier --write <file>   # Format specific files
```

Prettier is configured with Tailwind CSS plugin. Pre-commit hooks run via Husky with lint-staged.

### Deployment
```bash
vercel --prod --force    # Manual deployment to Vercel
```

## Architecture

### Data Model

The application uses three main DynamoDB tables:
- **Documents**: Top-level containers organizing resources into folders
- **Resources**: Actual file content stored as markdown (from parsing) with S3 URLs
- **ResourceMeta**: Metadata for resources (name, notes, tags, summary, dates)

Key types defined in `types/types.tsx`:
- `Document`: Contains folders, each with multiple resources
- `Resource`: File content with id, markdown, and S3 url
- `ResourceMeta`: Metadata linking to both resource and document
- `ResourceCompressed`: Lightweight resource representation for listings

### Application Structure

```
app/
├── api/                          # Next.js API routes
│   ├── auth/[...nextauth]/      # NextAuth configuration (Google + Credentials)
│   ├── db/                       # Database operations
│   │   ├── documents/           # Document CRUD operations
│   │   ├── resource/            # Resource operations
│   │   ├── resourcemeta/        # ResourceMeta CRUD
│   │   └── route.ts             # Shared DynamoDB helpers (getObject, putObject)
│   ├── resource_parsing/        # LlamaCloud API integration for parsing
│   ├── s3-upload/               # S3 file upload handling
│   └── user/                    # User profile operations
├── report-home/                 # Main application page (post-login)
├── login/                       # Login page
└── signup/                      # Signup page

components/
├── DocumentComponents/          # Document management UI
├── ResourceComponents/          # Resource viewing/editing UI
├── GeneralComponents/           # Shared UI components
├── ModalComponents/             # Modal dialogs
└── ui/                         # shadcn/ui components

context/
├── AppContext.tsx              # Resources and Documents state
├── AuthContext.tsx             # NextAuth SessionProvider wrapper
└── SwitchContext.tsx           # UI state management
```

### Authentication

- **NextAuth** configuration at `app/api/auth/[...nextauth]/route.ts`
- Supports Google OAuth and email/password credentials
- Middleware (`middleware.ts`) redirects unauthenticated users from root to `/login`
- User data stored in two DynamoDB tables: `curiocity-users` and `curiocity-local-login-users`

### State Management

Three React Context providers wrap the application (see `app/layout.tsx`):
- **AuthProvider**: NextAuth session management
- **CurrentResourceProvider** (AppContext): Manages current resource/meta, file uploads, and S3 operations
- **SwitchProvider**: UI state (view switching between documents/resources)

### AWS Integration

**DynamoDB**: AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- Connection initialized in API routes with region `us-west-1`
- Table names from environment variables: `DOCUMENT_TABLE`, `RESOURCEMETA_TABLE`, `RESOURCE_TABLE`
- Common operations in `app/api/db/route.ts`: `getObject`, `putObject`, `deleteObject`

**S3**: File storage with `next-s3-upload` library
- Bucket: `wdb-curiocity-bucket` (region `us-west-1`)
- Files uploaded via `app/api/s3-upload/` endpoint
- Image domains configured in `next.config.js`

### Resource Parsing

- Files parsed using **LlamaCloud API** (LlamaIndex)
- Endpoint: `app/api/resource_parsing/route.ts`
- Parsing can be disabled via `DISABLE_PARSING` environment variable
- Known issue: Some files are skipped or parsed unnecessarily

## Important Patterns

### Path Aliases
Use `@/*` to import from project root:
```typescript
import { Resource } from '@/types/types';
import { someUtil } from '@/lib/utils';
```

**Note:** Not all imports currently use this pattern (known inconsistency).

### API Route Pattern
```typescript
// app/api/some-endpoint/route.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getObject, putObject } from '../route'; // Shared helpers

const client = new DynamoDBClient({ region: 'us-west-1' });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // ... implementation
}
```

### Context Usage
```typescript
// In components:
import { useCurrentResource } from '@/context/AppContext';

const { currentResource, fetchResourceAndMeta } = useCurrentResource();
```

## Known Issues

1. **File Upload Bug**: Files occasionally fail to upload with Error 413 (likely in `components/ResourceComponents/S3Button.tsx` - `UploadAllFiles` function)
2. **Parsing Issues**: Files sometimes skipped or unnecessarily parsed
3. **Import Standardization**: Not all files use `@/*` path aliases consistently
4. **Mobile Responsiveness**: Not implemented for devices smaller than laptop screens

## Environment Variables

Required variables (see `.env` - not in repo):
- `NEXTAUTH_URL`: Application URL (localhost:3000 for dev, Vercel URL for prod)
- `NEXTAUTH_SECRET`: NextAuth secret key
- `GOOGLE_ID`, `GOOGLE_SECRET`: Google OAuth credentials
- `DOCUMENT_TABLE`, `RESOURCEMETA_TABLE`, `RESOURCE_TABLE`: DynamoDB table names
- `S3_UPLOAD_REGION`, `S3_UPLOAD_KEY`, `S3_UPLOAD_SECRET`: S3 credentials
- `LLAMA_CLOUD_API_KEY`: LlamaCloud API for parsing
- `DISABLE_PARSING`: Set to `true` to disable resource parsing

## Testing

- **Jest** configured with `ts-jest` and `jsdom` environment
- Test files: `**/__tests__/**/*.test.ts(x)`
- Setup file: `setupTests.ts`
- Run single test: `npm test -- path/to/test.test.ts`

## Code Style

- **Prettier**: 80 char line width, single quotes, trailing commas, Tailwind CSS class sorting
- **ESLint**: Next.js config with `@typescript-eslint/no-explicit-any` disabled
- **Pre-commit hooks**: Husky + lint-staged runs ESLint and Prettier on staged files
