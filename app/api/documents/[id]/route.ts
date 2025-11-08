/**
 * GET & DELETE /api/documents/[id] - Document Operations
 *
 * Handles retrieval and deletion of individual documents.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 3: API Routes
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 5.2 (API Routes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentService } from '@/services/DocumentService';
import { PrismaDocumentRepository } from '@/infrastructure/repositories/PrismaDocumentRepository';
import { FileStorageService } from '@/services/FileStorageService';
import { ParserService } from '@/services/ParserService';
import { prisma } from '@/lib/db';

/**
 * GET /api/documents/[id] - Get a single document
 *
 * Returns:
 * - 200: Document found
 * - 401: Unauthorized
 * - 404: Document not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Initialize service with dependencies
  const documentService = new DocumentService(
    new PrismaDocumentRepository(prisma),
    new FileStorageService(),
    new ParserService(),
  );

  try {
    // Get document by ID
    const document = await documentService.getDocument(params.id);

    // Return document
    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    // Handle "not found" error (404)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Re-throw unexpected errors (will be caught by Next.js error handler)
    throw error;
  }
}

/**
 * DELETE /api/documents/[id] - Delete a document
 *
 * Returns:
 * - 204: Document deleted successfully (no content)
 * - 401: Unauthorized
 * - 404: Document not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Initialize service with dependencies
  const documentService = new DocumentService(
    new PrismaDocumentRepository(prisma),
    new FileStorageService(),
    new ParserService(),
  );

  try {
    // Delete document (service handles file deletion and DB soft delete)
    await documentService.deleteDocument(params.id);

    // Return 204 No Content (successful deletion)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Handle "not found" error (404)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Re-throw unexpected errors (will be caught by Next.js error handler)
    throw error;
  }
}
