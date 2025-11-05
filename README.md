# Curiocity

A Next.js application for document and resource management with intelligent file parsing capabilities.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Getting Started - Local Development](#getting-started---local-development)
- [Cloud Deployment Setup](#cloud-deployment-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Development Commands](#development-commands)
- [Known Issues](#known-issues)
- [Contributing](#contributing)
- [Contact](#contact)

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **AWS DynamoDB** - NoSQL database (5 tables)
- **AWS S3** - File storage
- **NextAuth** - Authentication (Google OAuth + Email/Password)
- **LlamaCloud** - AI-powered document parsing
- **Tailwind CSS** - Styling
- **PostHog** - Analytics

## Key Features

- **Document Management** - Organize resources into documents with folder structures
- **Resource Upload** - Upload files with automatic AI parsing to markdown
- **Content Deduplication** - Intelligent file storage to avoid duplicates
- **Rich Metadata** - Add notes, tags, and summaries to resources
- **Search & Filtering** - Filter by file type, date range, and search by name
- **Authentication** - Sign in with Google or email/password
- **Analytics** - Track usage with PostHog

---

## Getting Started - Local Development

**No AWS account needed for local development!** We use LocalStack to emulate AWS services.

### Prerequisites

- **Node.js 18.x** - [Download here](https://nodejs.org/)
- **Docker** - [Download here](https://www.docker.com/products/docker-desktop/)
- **npm** (comes with Node.js)

### Step 1: Clone the Repository

```bash
git clone https://github.com/wdbxcuriocity/curiocity.git
cd curiocity
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start LocalStack (AWS Emulator)

Start Docker, then run:

```bash
docker-compose up -d
```

This starts LocalStack with DynamoDB and S3 services on `localhost:4566`.

To verify it's running:

```bash
docker ps
```

You should see a container named `curiocity-localstack`.

### Step 4: Initialize Local Database and Storage

```bash
npm run local:setup
```

This creates:
- 5 DynamoDB tables (users, documents, resources, etc.)
- S3 bucket for file storage
- CORS configuration

### Step 5: Configure Environment Variables

```bash
cp .env.local.example .env.local
```

**Edit `.env.local` and set:**

```bash
# Required - Generate a random string
NEXTAUTH_SECRET=your-secret-here

# Optional - Only if you want Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Optional - Only if you want file parsing
LLAMA_CLOUD_API_KEY=your-llama-api-key
DISABLE_PARSING=false  # Set to true to skip parsing
```

> **Note:** For local development, you can use email/password authentication without Google OAuth, and you can disable file parsing. The default values in `.env.local.example` work out of the box!

### Step 6: Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

### Local Development Notes

- **Database**: LocalStack DynamoDB on `localhost:4566`
- **File Storage**: LocalStack S3 on `localhost:4566`
- **Authentication**: Email/password works without Google OAuth setup
- **File Parsing**: Can be disabled with `DISABLE_PARSING=true`
- **Analytics**: PostHog is optional for local development

### Stopping LocalStack

```bash
docker-compose down
```

To also delete all data:

```bash
docker-compose down -v
rm -rf localstack-data/
```

---

## Cloud Deployment Setup

For production deployment to Vercel with real AWS services.

### Prerequisites

- Vercel account
- AWS account with DynamoDB and S3 access
- Google OAuth credentials (optional)
- LlamaCloud API key (optional)
- PostHog account (optional)

### AWS Setup

#### 1. Create DynamoDB Tables

Create 5 tables in AWS Console (region: `us-west-1`):

| Table Name | Partition Key | Type |
|------------|---------------|------|
| `curiocity-users` | `id` | String |
| `curiocity-local-login-users` | `email` | String |
| `curiocity-documents` | `id` | String |
| `curiocity-resources` | `id` | String |
| `curiocity-resourcemeta` | `id` | String |

**Billing mode:** On-demand (PAY_PER_REQUEST)

#### 2. Create S3 Bucket

1. Create bucket: `wdb-curiocity-bucket` (or your own name)
2. Region: `us-west-1`
3. Enable public read access for uploaded files
4. Add CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### 3. Get AWS Credentials

Create an IAM user with:
- DynamoDB full access
- S3 full access

Save the Access Key ID and Secret Access Key.

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Save Client ID and Client Secret

### LlamaCloud Setup (Optional)

1. Sign up at [LlamaIndex Cloud](https://cloud.llamaindex.ai/)
2. Generate API key
3. Or set `DISABLE_PARSING=true` to skip parsing

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod --force
```

### Environment Variables for Vercel

In Vercel project settings, add:

```bash
# NextAuth
NEXTAUTH_URL=https://your-vercel-url.vercel.app
NEXTAUTH_SECRET=your-production-secret

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# AWS DynamoDB
DOCUMENT_TABLE=curiocity-documents
RESOURCE_TABLE=curiocity-resources
RESOURCEMETA_TABLE=curiocity-resourcemeta

# AWS S3
S3_UPLOAD_REGION=us-west-1
S3_UPLOAD_KEY=your-aws-access-key
S3_UPLOAD_SECRET=your-aws-secret-key
S3_UPLOAD_BUCKET=wdb-curiocity-bucket

# LlamaCloud (optional)
LLAMA_CLOUD_API_KEY=your-llama-api-key
DISABLE_PARSING=false

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Environment Variables Reference

### Required for All Environments

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Generate with `openssl rand -base64 32` |
| `DOCUMENT_TABLE` | DynamoDB documents table | `curiocity-documents` |
| `RESOURCE_TABLE` | DynamoDB resources table | `curiocity-resources` |
| `RESOURCEMETA_TABLE` | DynamoDB metadata table | `curiocity-resourcemeta` |

### Optional Services

| Variable | Description | Required For |
|----------|-------------|--------------|
| `GOOGLE_ID` | Google OAuth Client ID | Google sign-in |
| `GOOGLE_SECRET` | Google OAuth Secret | Google sign-in |
| `LLAMA_CLOUD_API_KEY` | LlamaCloud API key | File parsing |
| `DISABLE_PARSING` | Disable parsing (`true`/`false`) | Skip parsing |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL | Analytics |

### Local Development Only

| Variable | Description | Value |
|----------|-------------|-------|
| `AWS_ACCESS_KEY_ID` | LocalStack credential | `test` |
| `AWS_SECRET_ACCESS_KEY` | LocalStack credential | `test` |
| `AWS_ENDPOINT_URL` | LocalStack endpoint | `http://localhost:4566` |

### Production Only

| Variable | Description |
|----------|-------------|
| `S3_UPLOAD_KEY` | AWS Access Key ID |
| `S3_UPLOAD_SECRET` | AWS Secret Access Key |
| `S3_UPLOAD_REGION` | S3 bucket region |
| `S3_UPLOAD_BUCKET` | S3 bucket name |

---

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

### Local Environment Management

```bash
npm run local:setup  # Initialize DynamoDB tables + S3 bucket
npm run local:db     # Initialize only DynamoDB tables
npm run local:s3     # Initialize only S3 bucket
```

### Code Formatting

```bash
npx prettier --write <file>   # Format specific files
```

Pre-commit hooks automatically run ESLint and Prettier via Husky.

### Deployment

```bash
vercel --prod --force    # Manual deployment to Vercel
```

---

## File Structure

```
curiocity/
├── app/
│   ├── api/                    # API routes (28 endpoints)
│   │   ├── auth/               # NextAuth configuration
│   │   ├── db/                 # Database operations
│   │   ├── resource_parsing/   # LlamaCloud integration
│   │   ├── s3-upload/          # S3 file upload
│   │   └── user/               # User management
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   └── report-home/            # Main application
├── components/
│   ├── DocumentComponents/     # Document UI
│   ├── ResourceComponents/     # Resource UI
│   ├── GeneralComponents/      # Shared components
│   └── ModalComponents/        # Modal dialogs
├── context/
│   ├── AppContext.tsx          # Resource & Document state
│   ├── AuthContext.tsx         # Auth state
│   └── SwitchContext.tsx       # UI state
├── scripts/
│   ├── init-local-db.js        # Initialize local DynamoDB
│   └── init-local-s3.js        # Initialize local S3
├── types/
│   └── types.tsx               # TypeScript definitions
├── docker-compose.yml          # LocalStack configuration
├── .env.local.example          # Environment template
└── README.md
```

---

## Known Issues

### 1. File Upload Error 413

**Issue:** Large file uploads occasionally fail with "Payload Too Large"

**Location:** `components/ResourceComponents/S3Button.tsx` (UploadAllFiles function)

**Workaround:** Upload smaller files or increase Vercel body size limit

### 2. File Parsing Issues

**Issue:** Some files are skipped or unnecessarily parsed

**Workaround:** Set `DISABLE_PARSING=true` to disable parsing entirely

### 3. TypeScript and ESLint in Production

**Note:** TypeScript errors and ESLint warnings do not block builds (see `next.config.js`)

This is intentional for rapid iteration but should be fixed before production deployment.

### 4. Mobile Responsiveness

**Not implemented** for devices smaller than laptop screens.

---

## Architecture Notes

### Data Model

The application uses **content deduplication**:

- **Resource Table**: Stores file content once (keyed by MD5 hash)
- **ResourceMeta Table**: Stores user-specific metadata (name, notes, tags)
- Same file uploaded 10 times = 1 Resource + 10 ResourceMeta entries

### Build Configuration

ESLint and TypeScript checks are ignored during builds (`next.config.js`):

```javascript
eslint: {
  ignoreDuringBuilds: true
},
typescript: {
  ignoreBuildErrors: true
}
```

---

## Contributing

### Code Style

- **Prettier**: 80 char line width, single quotes
- **ESLint**: Next.js config
- **Imports**: Use `@/*` path alias for project root

### Pre-commit Hooks

Husky + lint-staged automatically format code on commit.

---

## Documentation

- **CLAUDE.md** - Guidance for AI code assistance
- **codebase-analysis-docs/CODEBASE_KNOWLEDGE.md** - Comprehensive codebase reference (2,868 lines)
- **docs/audits/** - Architecture audit reports

---

## Contact Information

**Created by:**

- **Web Development at Berkeley** - [webatberkeley@gmail.com](mailto:webatberkeley@gmail.com)
- **Jason Duong** - [jasonduong@berkeley.edu](mailto:jasonduong@berkeley.edu)
- **Ashley Zheng** - [ashley.zheng@berkeley.edu](mailto:ashley.zheng@berkeley.edu)

---

## License

This project is private and not licensed for public use.
