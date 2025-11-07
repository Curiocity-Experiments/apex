/**
 * /api/reports/[id] endpoints (GET, PATCH, DELETE)
 *
 * GET - Retrieve a single report by ID
 * PATCH - Update a report
 * DELETE - Soft delete a report
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 3: API Routes
 * @see services/ReportService.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReportService } from '@/services/ReportService';
import { PrismaReportRepository } from '@/infrastructure/repositories/PrismaReportRepository';
import { prisma } from '@/lib/db';

/**
 * GET /api/reports/[id]
 * Retrieve a single report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch report using service layer
    const reportService = new ReportService(new PrismaReportRepository(prisma));

    const report = await reportService.getReport(params.id, session.user.id);

    // 3. Return report
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      if (error.message === 'Report not found') {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 },
        );
      }
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Handle unexpected errors
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/reports/[id]
 * Update a report (name and/or content)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { name, content } = body;

    // At least one field must be provided
    if (name === undefined && content === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name or content) must be provided' },
        { status: 400 },
      );
    }

    // Build updates object
    const updates: { name?: string; content?: string } = {};
    if (name !== undefined) updates.name = name;
    if (content !== undefined) updates.content = content;

    // 3. Update report using service layer
    const reportService = new ReportService(new PrismaReportRepository(prisma));

    const report = await reportService.updateReport(
      params.id,
      session.user.id,
      updates,
    );

    // 4. Return updated report
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      if (error.message === 'Report not found') {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 },
        );
      }
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (
        error.message.includes('cannot be empty') ||
        error.message.includes('too long')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Handle unexpected errors
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * Soft delete a report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Delete report using service layer
    const reportService = new ReportService(new PrismaReportRepository(prisma));

    await reportService.deleteReport(params.id, session.user.id);

    // 3. Return no content (204)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      if (error.message === 'Report not found') {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 },
        );
      }
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Handle unexpected errors
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
