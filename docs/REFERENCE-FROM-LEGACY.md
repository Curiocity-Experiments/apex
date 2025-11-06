# Reference Guide: Legacy Curiocity Patterns for Apex Development

This document catalogs useful patterns, utilities, and implementations from the legacy Curiocity codebase that should be referenced when building Apex (ResearchHub rebuild).

**Git Reference:** Commit `30b5e85` (Clean documentation: Remove legacy references and rename to Apex)

---

## Table of Contents

1. [Configuration Files](#configuration-files)
2. [Utility Functions](#utility-functions)
3. [Type Definitions](#type-definitions)
4. [API Patterns](#api-patterns)
5. [Authentication & Authorization](#authentication--authorization)
6. [AWS Integration](#aws-integration)
7. [File Upload & Processing](#file-upload--processing)
8. [UI Components](#ui-components)
9. [State Management](#state-management)
10. [Development Setup](#development-setup)

---

## Configuration Files

### 1. Next.js Configuration

**File:** `/next.config.js`

**What it is:** Next.js configuration with S3 image domains, PDF worker setup, and build settings.

**Why it's useful:**
- Configures S3 image domains for Next.js Image component
- Sets up PDF.js worker for PDF viewing
- Worker thread configuration for performance

**Key implementation details:**
```javascript
module.exports = {
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Google OAuth profile images
      'wdb-curiocity-bucket.s3.amazonaws.com',
      'wdb-curiocity-bucket.s3.us-west-1.amazonaws.com',
    ],
  },
  experimental: {
    workerThreads: true,
    cpus: 1,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js$/,
      type: 'asset/resource',
    });
    return config;
  },
};
```

**Apex equivalent:**
- `/apex/next.config.js` - Update with new S3 bucket domains
- Keep PDF worker configuration if PDF viewing is needed
- May want to enable TypeScript/ESLint checking (currently disabled in legacy)

---

### 2. Tailwind Configuration

**File:** `/tailwind.config.ts`

**What it is:** Tailwind CSS configuration with custom color palette and design tokens.

**Why it's useful:**
- Well-defined custom color scheme for consistency
- Proper dark mode setup
- Border radius design tokens

**Key implementation details:**
```typescript
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        fileRed: '#C71408',
        fileOrange: '#C76408',
        fileBlue: '#0877C7',
        fileLightTeal: '#08C79A',
        fileGreen: '#0CC708',
        accentPrimary: '#00A3FF',
        accentSecondary: '#03ADAE',
        bgPrimary: '#1A111F',
        bgSecondary: '#130E16',
        textPrimary: '#FFFFFF',
        textSecondary: '#BFBFBF',
      },
    },
  },
};
```

**Apex equivalent:**
- `/apex/tailwind.config.ts` - Will use new Apex design system colors
- Reference this structure for organizing custom colors
- Keep dark mode setup pattern

---

### 3. TypeScript Configuration

**File:** `/tsconfig.json`

**What it is:** TypeScript compiler configuration with path aliases.

**Why it's useful:**
- Sets up `@/*` path alias for clean imports
- Proper module resolution for Next.js
- Testing library types included

**Key implementation details:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    },
    "strict": true,
    "moduleResolution": "node"
  }
}
```

**Apex equivalent:**
- `/apex/tsconfig.json` - Keep same path alias setup
- Consider enabling `noImplicitAny` in strict mode

---

### 4. Prettier Configuration

**File:** `/.prettierrc`

**What it is:** Code formatting rules with Tailwind CSS plugin.

**Why it's useful:**
- Consistent code style across team
- Auto-sorts Tailwind classes
- Good default settings

**Key implementation details:**
```json
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "printWidth": 80,
  "singleQuote": true,
  "trailingComma": "all"
}
```

**Apex equivalent:**
- `/apex/.prettierrc` - Keep same configuration
- Tailwind plugin ensures class order consistency

---

### 5. ESLint Configuration

**File:** `/.eslintrc.json`

**What it is:** Minimal ESLint configuration for Next.js.

**Key implementation details:**
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": { "@typescript-eslint/no-explicit-any": "off" }
}
```

**Apex equivalent:**
- Consider enabling `no-explicit-any` for better type safety
- Keep Next.js presets

---

### 6. Package.json Scripts

**File:** `/package.json`

**What it is:** NPM scripts for development, testing, and deployment.

**Why it's useful:**
- `npm run dev` - Turbo mode for faster dev server
- Local setup scripts for DynamoDB and S3
- Pre-commit hooks with Husky

**Key scripts:**
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "local:setup": "node scripts/init-local-db.js && node scripts/init-local-s3.js",
    "test": "jest"
  }
}
```

**Apex equivalent:**
- Keep Turbo mode for dev
- Update local setup scripts for new schema
- Maintain pre-commit hooks

---

### 7. shadcn/ui Configuration

**File:** `/components.json`

**What it is:** Configuration for shadcn/ui component library.

**Why it's useful:**
- Defines component installation paths
- Sets up utility function aliases
- Configures Tailwind integration

**Key implementation details:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

**Apex equivalent:**
- Keep same configuration
- shadcn/ui components can be reused as-is

---

## Utility Functions

### 1. cn() - Class Name Utility

**File:** `/lib/utils.ts`

**What it is:** Utility function for merging Tailwind classes.

**Why it's useful:**
- Combines `clsx` and `tailwind-merge` for optimal class handling
- Prevents Tailwind class conflicts
- Essential for conditional styling

**Implementation:**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Apex equivalent:**
- `/apex/lib/utils.ts` - Copy exactly as-is
- Used throughout all UI components

---

## Type Definitions

### 1. Core Data Types

**File:** `/types/types.tsx`

**What it is:** TypeScript interfaces for Document, Resource, and Metadata.

**Why it's useful:**
- Well-structured data model
- Clear separation between Resource (content) and ResourceMeta (metadata)
- Compressed types for listings vs full data

**Key types:**
```typescript
export interface Resource {
  id: string;          // Hash of file content
  markdown: string;    // Parsed content
  url: string;         // S3 URL
}

export interface ResourceCompressed {
  name: string;
  id: string;
  dateAdded: string;
  lastOpened: string;
  fileType: string;
}

export interface ResourceMeta {
  id: string;          // Unique ID
  hash: string;        // Links to Resource
  name: string;
  dateAdded: string;
  lastOpened: string;
  notes: string;
  summary: string;
  tags: Array<string>;
  documentId: string;  // Parent document
  fileType: string;
}

export interface Document {
  id: string;
  name: string;
  text: string;
  folders: Record<string, FolderData>;
  dateAdded: string;
  lastOpened: string;
  tags: Array<string>;
  ownerID: string;
}

export interface FolderData {
  name: string;
  resources: Array<ResourceCompressed>;
}
```

**Apex equivalent:**
- Reference this structure when designing new data models
- New Apex schema will be different but can learn from this pattern
- Good separation of concerns: content hash-based deduplication

---

## API Patterns

### 1. DynamoDB Helper Functions

**File:** `/app/api/db/route.ts`

**What it is:** Reusable CRUD functions for DynamoDB operations.

**Why it's useful:**
- Centralized error handling
- Consistent marshalling/unmarshalling
- Used across all API routes

**Key functions:**
```typescript
import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import AWS from 'aws-sdk';

const client = new DynamoDBClient({ region: 'us-west-1' });

export const getObject = async (client: any, id: any, table: string) => {
  const res = await client.send(
    new GetItemCommand({
      TableName: table,
      Key: { id: { S: id } },
    })
  );
  return res;
};

export const putObject = async (client: any, inputData: any, table: string) => {
  const res = await client.send(
    new PutItemCommand({
      TableName: table,
      Item: inputData as any,
    })
  );
  return res;
};

export const deleteObject = async (client: any, id: any, table: string) => {
  // Includes recursive deletion logic for documents
  const command = new DeleteItemCommand({
    TableName: table,
    Key: { id: { S: id } },
  });
  const data = await client.send(command);
  return data;
};
```

**Apex equivalent:**
- Create similar helper functions in `/apex/lib/db-helpers.ts`
- Adapt for new Apex schema
- Keep error handling pattern

---

### 2. API Route Pattern

**File:** `/app/api/db/route.ts` (example)

**What it is:** Standard pattern for Next.js API routes with DynamoDB.

**Why it's useful:**
- Consistent structure across all endpoints
- Proper error handling
- Query parameter parsing

**Pattern:**
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getObject, putObject } from './route';

const client = new DynamoDBClient({ region: 'us-west-1' });
const tableName = process.env.DOCUMENT_TABLE || '';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const item = await getObject(client, id, tableName);
  return Response.json(item.Item);
}

export async function POST(request: Request) {
  const data = await request.json();
  // ... validation
  const inputData = AWS.DynamoDB.Converter.marshall(data);
  await putObject(client, inputData, tableName);
  return Response.json({ success: true });
}

export async function PUT(request: Request) {
  const data = await request.json();
  // Fetch existing, merge, update
  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  const data = await request.json();
  await deleteObject(client, data.id, tableName);
  return Response.json({ msg: 'success' });
}
```

**Apex equivalent:**
- Follow this pattern for all API routes
- Add TypeScript types for request/response
- Consider adding Zod validation

---

### 3. File Type Inference

**File:** `/app/api/db/resourcemeta/upload/route.ts`

**What it is:** Helper function to determine file type from extension.

**Why it's useful:**
- Used for file icons and filtering
- Handles common document types

**Implementation:**
```typescript
function inferFileType(nameOrUrl: string): string {
  const lower = nameOrUrl.toLowerCase();

  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'Word';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'Excel';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'PowerPoint';
  if (lower.endsWith('.csv')) return 'CSV';
  if (lower.endsWith('.htm') || lower.endsWith('.html')) return 'HTML';
  if (lower.endsWith('.png')) return 'PNG';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'JPG';
  if (lower.endsWith('.gif')) return 'GIF';
  if (lower.startsWith('http')) return 'Link';

  return 'Other';
}
```

**Apex equivalent:**
- Create as `/apex/lib/file-utils.ts`
- Expand with more file types
- Use for file type badges in UI

---

## Authentication & Authorization

### 1. NextAuth Configuration

**File:** `/app/api/auth/[...nextauth]/route.ts`

**What it is:** Complete NextAuth setup with Google OAuth and credentials provider.

**Why it's useful:**
- Working implementation of dual authentication
- User creation/update on signin
- JWT token management
- Session callbacks

**Key implementation:**
```typescript
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcrypt';

const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Fetch user from DynamoDB
        // Verify password with bcrypt
        // Return user object
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      // Create or update user in database
    },
    async jwt({ token, user }) {
      // Add custom fields to JWT
    },
    async session({ session, token }) {
      // Add user data to session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    signOut: '/logout',
  },
};

const handler = NextAuth(options);
export { handler as GET, handler as POST };
```

**Apex equivalent:**
- Copy this entire pattern to `/apex/app/api/auth/[...nextauth]/route.ts`
- Update table names for new schema
- May add additional providers
- Keep the signIn callback pattern for user auto-creation

---

### 2. Authentication Middleware

**File:** `/middleware.ts`

**What it is:** Next.js middleware for protecting routes.

**Why it's useful:**
- Redirects unauthenticated users
- Uses NextAuth JWT validation
- Simple and effective

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const AUTH_PAGE = '/login';
const AUTHORIZED_PAGE = '/report-home';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL(AUTH_PAGE, req.url));
  }

  return NextResponse.redirect(new URL(AUTHORIZED_PAGE, req.url));
}

export const config = {
  matcher: '/',
};
```

**Apex equivalent:**
- Update for new Apex routes
- May need additional matchers for protected paths

---

### 3. Manual Signup Route

**File:** `/app/api/manual-signup/route.ts`

**What it is:** Email/password registration endpoint.

**Why it's useful:**
- Password validation regex
- bcrypt password hashing
- Creates entries in two tables (login + user)

**Key patterns:**
```typescript
const isPasswordValid = (password: string) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
  return passwordRegex.test(password);
};

const hashedPassword = await bcrypt.hash(password, 10);
const userId = crypto.randomUUID();

// Store in login table
await ddbDocClient.send(new PutCommand({
  TableName: LOGIN_USERS_TABLE,
  Item: { email, password: hashedPassword, userId }
}));

// Store in user table
await fetch('/api/user', {
  method: 'POST',
  body: JSON.stringify({ id: userId, name, email })
});
```

**Apex equivalent:**
- Keep password validation pattern
- Adapt for new user schema
- Consider adding email verification

---

### 4. Auth Context Provider

**File:** `/context/AuthContext.tsx`

**What it is:** Wrapper for NextAuth SessionProvider.

**Why it's useful:**
- Clean separation of concerns
- Easy to add custom auth logic later

**Implementation:**
```typescript
'use client';
import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Apex equivalent:**
- Keep this simple pattern
- Wrap in app layout

---

## AWS Integration

### 1. DynamoDB Client Setup

**File:** `/app/api/db/route.ts`

**What it is:** Standard pattern for initializing DynamoDB client.

**Key pattern:**
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import AWS from 'aws-sdk';

export const client = new DynamoDBClient({ region: 'us-west-1' });
export const tableName = process.env.DOCUMENT_TABLE || '';

// For marshalling/unmarshalling
const item = AWS.DynamoDB.Converter.marshall(data);
const data = AWS.DynamoDB.Converter.unmarshall(item);
```

**Apex equivalent:**
- Keep same client initialization
- Update region if needed
- Consider moving to environment variable

---

### 2. S3 Upload Configuration

**File:** `/app/api/s3-upload/route.ts`

**What it is:** Simple re-export of next-s3-upload.

**Why it's useful:**
- `next-s3-upload` handles presigned URLs
- No custom logic needed
- Works with environment variables

**Implementation:**
```typescript
export { POST } from 'next-s3-upload/route';
```

**Environment variables needed:**
```env
S3_UPLOAD_REGION=us-west-1
S3_UPLOAD_KEY=<access-key>
S3_UPLOAD_SECRET=<secret-key>
S3_UPLOAD_BUCKET=<bucket-name>
```

**Apex equivalent:**
- Keep same pattern
- Update bucket name
- Consider adding file type restrictions

---

### 3. S3 Upload Hook Usage

**File:** `/context/AppContext.tsx`

**What it is:** Client-side hook for uploading files to S3.

**Implementation:**
```typescript
import { useS3Upload } from 'next-s3-upload';

const { uploadToS3 } = useS3Upload();

const uploadResource = async (file: File) => {
  const { url } = await uploadToS3(file);
  // url is the S3 URL of uploaded file
};
```

**Apex equivalent:**
- Use in file upload components
- Works seamlessly with API route

---

## File Upload & Processing

### 1. LlamaParse Integration

**File:** `/app/api/resource_parsing/route.ts`

**What it is:** Complete implementation of LlamaCloud API for file parsing.

**Why it's useful:**
- Working implementation with polling
- Handles upload, job status, and result retrieval
- Edge runtime compatible

**Implementation:**
```typescript
export const runtime = 'edge';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('myFile');

  const uploadFormData = new FormData();
  uploadFormData.append('file', fileBlob, filename);
  uploadFormData.append('mode', 'fast');

  // Upload file
  const uploadResponse = await fetch(
    'https://api.cloud.llamaindex.ai/api/parsing/upload',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}`,
      },
      body: uploadFormData,
    }
  );

  const { id: jobId } = await uploadResponse.json();

  // Poll for completion
  let jobStatus = '';
  while (jobStatus !== 'SUCCESS') {
    const statusResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}`,
      { headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` } }
    );
    jobStatus = (await statusResponse.json()).status;
    if (jobStatus !== 'SUCCESS') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Get result
  const resultResponse = await fetch(
    `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}/result/raw/markdown`,
    { headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` } }
  );

  const markdown = await resultResponse.text();
  return NextResponse.json({ markdown });
}
```

**Apex equivalent:**
- Copy entire implementation
- May want to add timeout/max retries
- Consider background job for large files

---

### 2. File Upload with Deduplication

**File:** `/context/AppContext.tsx` - `uploadResource` function

**What it is:** Client-side upload logic with hash-based deduplication.

**Why it's useful:**
- Prevents duplicate file storage
- Separates content (Resource) from metadata (ResourceMeta)
- Handles parsing conditionally

**Key logic:**
```typescript
const uploadResource = async (file: File, folderName: string, documentId: string) => {
  // 1. Hash the file
  const fileBuffer = await file.arrayBuffer();
  const fileHash = crypto.createHash('md5')
    .update(Buffer.from(fileBuffer))
    .digest('hex');

  // 2. Check if content already exists
  const { exists } = await fetch(`/api/db/resource/check?hash=${fileHash}`).then(r => r.json());

  // 3. Upload to S3
  const { url } = await uploadToS3(file);

  // 4. If content doesn't exist, parse and store it
  if (!exists) {
    const parsedText = await extractText(file);
    await fetch('/api/db/resource/upload', {
      method: 'POST',
      body: JSON.stringify({ hash: fileHash, url, markdown: parsedText })
    });
  }

  // 5. Always create metadata (even for duplicate content)
  await fetch('/api/db/resourcemeta/upload', {
    method: 'POST',
    body: JSON.stringify({
      documentId,
      name: file.name,
      folderName,
      fileHash,
      url
    })
  });
};
```

**Apex equivalent:**
- Implement similar deduplication in new system
- Consider using SHA-256 instead of MD5
- May move parsing to background job

---

### 3. Resource Upload API Route

**File:** `/app/api/db/resource/upload/route.ts`

**What it is:** Server-side endpoint for storing parsed content.

**Why it's useful:**
- Markdown size limit enforcement (350KB)
- Auto-truncates if needed
- Prevents duplicate storage

**Key implementation:**
```typescript
const MAX_MARKDOWN_SIZE = 350 * 1024; // 350 KB

export async function POST(request: Request) {
  const data = await request.json();

  const resource: Resource = {
    id: data.hash,  // Hash is the ID
    markdown: data.markdown.length > MAX_MARKDOWN_SIZE
      ? data.markdown.slice(0, MAX_MARKDOWN_SIZE) + '...'
      : data.markdown,
    url: data.url,
  };

  // Only store if doesn't exist
  const existing = await getObject(client, data.hash, resourceTable);
  if (!existing.Item) {
    await putObject(client, AWS.DynamoDB.Converter.marshall(resource), resourceTable);
  }

  return Response.json({ hash: data.hash });
}
```

**Apex equivalent:**
- Keep size limit concept
- May store large files in S3 instead
- Consider compression for markdown

---

### 4. ResourceMeta Upload Route

**File:** `/app/api/db/resourcemeta/upload/route.ts`

**What it is:** Creates metadata and links resource to document/folder.

**Why it's useful:**
- Generates unique ID for metadata
- Updates parent document's folder structure
- Handles file type inference

**Key implementation:**
```typescript
export async function POST(request: Request) {
  const data = await request.json();

  // Create metadata with unique ID
  const resourceMetaId = uuidv4();
  const resourceMetaItem: ResourceMeta = {
    id: resourceMetaId,
    hash: data.fileHash,  // Links to Resource content
    name: data.name,
    documentId: data.documentId,
    folderName: data.folderName,
    fileType: inferFileType(data.name),
    // ... other fields
  };

  // Create compressed version for document listing
  const resourceMetaCompressed: ResourceCompressed = {
    id: resourceMetaId,
    name: data.name,
    fileType: inferFileType(data.name),
    // ... other fields
  };

  // Fetch parent document
  const document = await getObject(client, data.documentId, documentTable);
  const doc = AWS.DynamoDB.Converter.unmarshall(document.Item);

  // Add to folder
  if (!doc.folders[data.folderName]) {
    doc.folders[data.folderName] = { name: data.folderName, resources: [] };
  }
  doc.folders[data.folderName].resources.push(resourceMetaCompressed);

  // Save both
  await putObject(client, AWS.DynamoDB.Converter.marshall(resourceMetaItem), resourceMetaTable);
  await putObject(client, AWS.DynamoDB.Converter.marshall(doc), documentTable);

  return Response.json(doc);
}
```

**Apex equivalent:**
- Adapt for new Hub/Research/Resource schema
- Similar pattern for linking resources to parents
- Consider using transactions for atomic updates

---

## UI Components

### 1. shadcn/ui Button Component

**File:** `/components/ui/button.tsx`

**What it is:** Fully-configured shadcn/ui button with variants.

**Why it's useful:**
- Already set up and working
- Multiple variants (default, destructive, outline, ghost, link)
- Size variants (default, sm, lg, icon)
- Uses `cn()` utility for class merging

**Usage:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost" size="icon"><IconComponent /></Button>
```

**Apex equivalent:**
- Copy entire `/components/ui` folder
- All shadcn components are reusable
- May need to adjust colors for new design system

---

### 2. Other shadcn/ui Components

**Directory:** `/components/ui/`

**Available components:**
- `button.tsx` - Button with variants
- `dropdown-menu.tsx` - Dropdown menus
- `switch.tsx` - Toggle switches
- `resizable.tsx` - Resizable panels
- `label.tsx` - Form labels
- `form.tsx` - Form components with react-hook-form

**Apex equivalent:**
- Copy all as-is
- Can install more with `npx shadcn-ui@latest add <component>`

---

### 3. Custom Color Classes

**File:** `/tailwind.config.ts`

**What it is:** File type color coding system.

**Usage in components:**
```tsx
className={cn(
  'text-fileRed',      // PDF documents
  'text-fileBlue',     // Word documents
  'text-fileGreen',    // Excel
  'bg-accentPrimary',  // Primary accent
  'bg-bgPrimary',      // Main background
  'text-textSecondary' // Secondary text
)}
```

**Apex equivalent:**
- Reference for creating file type indicators
- Update colors to match new design system

---

## State Management

### 1. Resource Context Provider

**File:** `/context/AppContext.tsx`

**What it is:** React Context for managing current resource and metadata.

**Why it's useful:**
- Centralizes resource state
- Provides upload/fetch functions
- Used across multiple components

**Key functions:**
```typescript
interface CurrentResourceContextValue {
  currentResource: Resource | null;
  currentResourceMeta: ResourceMeta | null;
  fetchResourceAndMeta: (resourceMetaId: string, folderName: string) => Promise<void>;
  uploadResource: (file: File, folderName: string, documentId: string) => Promise<void>;
  extractText: (file: File) => Promise<string | null>;
  moveResource: (resourceId: string, sourceFolderName: string, targetFolderName: string, documentId: string) => Promise<void>;
}
```

**Apex equivalent:**
- Create similar context for Hub/Research/Resource state
- Keep pattern of context providing both state and actions
- Consider using Zustand for simpler state management

---

### 2. Document Context Provider

**File:** `/context/AppContext.tsx` (same file)

**What it is:** React Context for managing documents list and current document.

**Key functions:**
```typescript
interface CurrentDocumentContextProps {
  allDocuments: Document[];
  currentDocument: Document | null;
  fetchDocuments: () => Promise<void>;
  fetchDocument: (id: string) => Promise<void>;
  createDocument: (name: string, userId: string) => Promise<void>;
  viewingDocument: boolean;
  setViewingDocument: (isViewing: boolean) => void;
}
```

**Apex equivalent:**
- Adapt for Hub entity
- Similar fetch/create patterns
- May want separate contexts for Hub, Research, Resource

---

### 3. Context Provider Nesting

**File:** `/app/layout.tsx`

**What it is:** Proper nesting order for multiple context providers.

**Pattern:**
```tsx
<AuthProvider>
  <SwitchContextProvider>
    <CurrentDocumentProvider>
      <CurrentResourceProvider>
        <body>{children}</body>
      </CurrentResourceProvider>
    </CurrentDocumentProvider>
  </SwitchContextProvider>
</AuthProvider>
```

**Why it's useful:**
- Auth context wraps everything
- Document context can access auth
- Resource context can access document

**Apex equivalent:**
- Similar nesting: Auth → Hub → Research → Resource
- Keep auth as outermost

---

## Development Setup

### 1. Environment Variables

**File:** `/.env.local.example`

**What it is:** Complete template for environment configuration.

**Why it's useful:**
- Documents all required env vars
- Includes LocalStack configuration
- Has helpful comments

**Key sections:**
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
GOOGLE_ID=<from-google-console>
GOOGLE_SECRET=<from-google-console>

# DynamoDB Tables
DOCUMENT_TABLE=curiocity-documents
RESOURCE_TABLE=curiocity-resources
RESOURCEMETA_TABLE=curiocity-resourcemeta

# S3
S3_UPLOAD_REGION=us-west-1
S3_UPLOAD_KEY=<aws-key>
S3_UPLOAD_SECRET=<aws-secret>
S3_UPLOAD_BUCKET=<bucket-name>

# LlamaParse
LLAMA_CLOUD_API_KEY=<from-llamaindex>
DISABLE_PARSING=false

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY=<posthog-key>
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Apex equivalent:**
- Update table names
- Same structure otherwise
- Add any new API keys

---

### 2. Husky Pre-commit Hook

**File:** `/.husky/pre-commit`

**What it is:** Runs linting and formatting before commits.

**Implementation:**
```bash
npx lint-staged
npm run lint
```

**With lint-staged config:**
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": "eslint",
    "*.{js,jsx,ts,tsx,css,md}": "prettier --write"
  }
}
```

**Apex equivalent:**
- Keep same setup
- Prevents commits with linting errors
- Auto-formats on commit

---

### 3. Jest Configuration

**File:** `/jest.config.js`

**What it is:** Jest testing setup for Next.js with TypeScript.

**Why it's useful:**
- Configured for ts-jest
- jsdom environment for React components
- CSS/image mocks
- Path alias support

**Key config:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',  // Support @/* imports
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
};
```

**Setup file:**
```typescript
// setupTests.ts
import '@testing-library/jest-dom';
```

**Apex equivalent:**
- Copy configuration
- Add tests for new features
- Consider adding React Testing Library examples

---

### 4. LocalStack Scripts

**Files:** `/scripts/init-local-db.js`, `/scripts/init-local-s3.js`

**What they are:** Scripts to initialize local AWS services with Docker.

**Why they're useful:**
- Development without AWS account
- Fast local testing
- No AWS costs

**Usage:**
```bash
# Start LocalStack
docker-compose up -d

# Initialize services
npm run local:setup

# Or individually
npm run local:db
npm run local:s3
```

**Apex equivalent:**
- Keep scripts for local development
- Update table schemas
- May need to reset database structure

---

## Additional Patterns to Reference

### 1. DynamoDB Unmarshalling Pattern

**Common in many API routes:**

```typescript
import AWS from 'aws-sdk';

// Get from DynamoDB (returns marshalled data)
const response = await getObject(client, id, table);

// Convert to plain JavaScript object
const data = AWS.DynamoDB.Converter.unmarshall(response.Item);

// Modify
data.name = 'New name';

// Convert back for saving
const marshalledData = AWS.DynamoDB.Converter.marshall(data);
await putObject(client, marshalledData, table);
```

**Apex equivalent:**
- Use same pattern throughout
- Consider creating typed wrapper functions

---

### 2. Date Formatting

**File:** `/app/api/db/route.ts`

**Function for consistent timestamps:**

```typescript
const getCurrentTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
```

**Apex equivalent:**
- Use ISO 8601 format: `new Date().toISOString()`
- Simpler and more standard

---

### 3. PostHog Analytics Integration

**File:** `/app/api/db/route.ts` (and others)

**Pattern:**

```typescript
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

// Track events
posthog.capture({
  distinctId: userId,
  event: 'Document Created',
  properties: {
    documentId: doc.id,
    name: doc.name,
    createdAt: new Date().toISOString(),
  },
});

// Flush events
await posthog.flush();
```

**Apex equivalent:**
- Keep analytics if needed
- Track key user actions
- Consider moving to separate service

---

## Quick Reference: Key Dependencies

Based on `package.json`:

### AWS & Database
- `@aws-sdk/client-dynamodb` - DynamoDB client
- `@aws-sdk/lib-dynamodb` - Document client helpers
- `@aws-sdk/client-s3` - S3 client
- `aws-sdk` - Legacy SDK (for Converter)

### Authentication
- `next-auth` - NextAuth.js
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT handling

### File Handling
- `next-s3-upload` - S3 upload from client
- `pdfjs-dist` - PDF rendering
- `pdf-parse` - PDF text extraction
- `papaparse` - CSV parsing
- `turndown` - HTML to Markdown

### UI Libraries
- `@radix-ui/*` - Headless UI primitives (shadcn/ui)
- `lucide-react` - Icon library
- `framer-motion` - Animations
- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub Flavored Markdown

### Form Handling
- `react-hook-form` - Form library
- `@hookform/resolvers` - Form validation
- `zod` - Schema validation

### Styling
- `tailwindcss` - CSS framework
- `tailwind-merge` - Class merging
- `clsx` - Conditional classes
- `class-variance-authority` - Component variants

### Development
- `prettier` + `prettier-plugin-tailwindcss`
- `eslint` + `eslint-config-next`
- `jest` + `ts-jest` + `@testing-library/react`
- `husky` + `lint-staged`

---

## Summary: Must-Keep vs Can-Improve

### ✅ Must Keep (Working Well)

1. **NextAuth configuration** - Complete working implementation
2. **S3 upload pattern** - Simple and effective
3. **LlamaParse integration** - Working file parsing
4. **shadcn/ui components** - Well-configured UI library
5. **DynamoDB helper functions** - Reusable CRUD operations
6. **Tailwind + Prettier setup** - Good developer experience
7. **File type inference** - Useful utility
8. **Husky pre-commit hooks** - Code quality enforcement
9. **Path aliases** (`@/*`) - Clean imports
10. **Environment variable structure** - Well-documented

### ⚠️ Can Improve

1. **Type safety** - Add Zod validation for API routes
2. **Error handling** - More granular error messages
3. **File hashing** - Use SHA-256 instead of MD5
4. **State management** - Consider Zustand over Context
5. **Data model** - New schema more normalized
6. **Parsing** - Move to background jobs for large files
7. **Testing** - Add more test coverage
8. **TypeScript** - Enable stricter checks
9. **Date formatting** - Use ISO 8601 consistently
10. **Analytics** - Centralize PostHog tracking

---

## How to Use This Document

When implementing features in Apex:

1. **Authentication setup** → Reference NextAuth section
2. **File uploads** → Reference S3 + LlamaParse sections
3. **Database operations** → Reference DynamoDB helpers
4. **UI components** → Use shadcn/ui components as-is
5. **Configuration** → Copy config files with updates
6. **Testing** → Reference Jest configuration
7. **Local dev** → Use LocalStack scripts

**Git Reference:** All code references are at commit `30b5e85`

```bash
git checkout 30b5e85 -- <file-path>  # To copy specific files
```

---

**Last Updated:** 2025-11-06
**Created by:** Claude Code Analysis
**Purpose:** Reference guide for building Apex from Curiocity patterns
