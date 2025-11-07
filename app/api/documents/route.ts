/**
 * POST /api/documents - Upload Document
 *
 * Handles multipart/form-data file uploads for documents.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 3: API Routes (Step 16)
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 5.2 (API Routes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentService } from '@/services/DocumentService';
import { PrismaDocumentRepository } from '@/infrastructure/repositories/PrismaDocumentRepository';
import { FileStorageService } from '@/services/FileStorageService';
import { ParserService } from '@/services/ParserService';

/**
 * POST /api/documents - Upload a new document
 *
 * Request body (multipart/form-data):
 * - file: File to upload
 * - reportId: ID of parent report
 *
 * Returns:
 * - 201: Document created successfully
 * - 400: Missing required fields
 * - 401: Unauthorized
 * - 409: Document already exists (duplicate file hash)
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse multipart/form-data
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const reportId = formData.get('reportId') as string;

  // Validate required fields
  if (!file || !reportId) {
    return NextResponse.json(
      { error: 'File and reportId are required' },
      { status: 400 },
    );
  }

  // Initialize service with dependencies
  const documentService = new DocumentService(
    new PrismaDocumentRepository(),
    new FileStorageService(),
    new ParserService(),
  );

  try {
    // Upload document (service handles file storage, parsing, and DB save)
    const document = await documentService.uploadDocument(
      reportId,
      file,
      file.name,
    );

    // Return created document
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    // Handle duplicate file error (409 Conflict)
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Re-throw unexpected errors (will be caught by Next.js error handler)
    throw error;
  }
}
