/**
 * /api/reports endpoints (POST, GET)
 *
 * POST - Create a new report
 * GET - List all reports for authenticated user
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
 * POST /api/reports
 * Create a new report
 */
export async function POST(request: NextRequest) {
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

    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // 3. Create report using service layer
    const reportService = new ReportService(new PrismaReportRepository(prisma));

    const report = await reportService.createReport(session.user.id, name);

    // 4. Return created report
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    // Handle service-level validation errors
    if (error instanceof Error) {
      if (
        error.message.includes('cannot be empty') ||
        error.message.includes('too long')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Handle unexpected errors
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/reports
 * List all reports for authenticated user
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch reports using service layer
    const reportService = new ReportService(new PrismaReportRepository(prisma));

    const reports = await reportService.listReports(session.user.id);

    // 3. Return reports
    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    // Handle unexpected errors
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
