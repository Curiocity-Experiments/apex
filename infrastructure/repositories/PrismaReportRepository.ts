/**
 * Prisma Implementation of ReportRepository
 *
 * Provides database access for Report entities using Prisma ORM.
 *
 * @see domain/repositories/ReportRepository.ts - Interface contract
 * @see __tests__/infrastructure/repositories/PrismaReportRepository.test.ts - Tests
 */

import { PrismaClient } from '@prisma/client';
import { Report } from '@/domain/entities/Report';
import { ReportRepository } from '@/domain/repositories/ReportRepository';

export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Report | null> {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    return report;
  }

  async findByUserId(
    userId: string,
    includeDeleted = false,
  ): Promise<Report[]> {
    const where: any = {
      userId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports;
  }

  async save(report: Report): Promise<Report> {
    const saved = await this.prisma.report.upsert({
      where: { id: report.id },
      create: {
        id: report.id,
        userId: report.userId,
        name: report.name,
        content: report.content,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        deletedAt: report.deletedAt,
      },
      update: {
        name: report.name,
        content: report.content,
        updatedAt: report.updatedAt,
        deletedAt: report.deletedAt,
      },
    });

    return saved;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.report.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch {
      // Silently handle if report doesn't exist
      // This matches the interface contract
    }
  }

  async search(userId: string, query: string): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports;
  }
}
