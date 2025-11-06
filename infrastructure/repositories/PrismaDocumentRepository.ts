/**
 * Prisma Implementation of DocumentRepository
 *
 * Provides database access for Document entities using Prisma ORM.
 *
 * @see domain/repositories/DocumentRepository.ts - Interface contract
 * @see __tests__/infrastructure/repositories/PrismaDocumentRepository.test.ts - Tests
 */

import { PrismaClient } from '@prisma/client';
import { Document } from '@/domain/entities/Document';
import { DocumentRepository } from '@/domain/repositories/DocumentRepository';

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Document | null> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    return document;
  }

  async findByReportId(
    reportId: string,
    includeDeleted = false,
  ): Promise<Document[]> {
    const where: any = {
      reportId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const documents = await this.prisma.document.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }

  async findByHash(
    reportId: string,
    fileHash: string,
  ): Promise<Document | null> {
    const document = await this.prisma.document.findFirst({
      where: {
        reportId,
        fileHash,
        deletedAt: null,
      },
    });

    return document;
  }

  async save(document: Document): Promise<Document> {
    const saved = await this.prisma.document.upsert({
      where: { id: document.id },
      create: {
        id: document.id,
        reportId: document.reportId,
        filename: document.filename,
        fileHash: document.fileHash,
        storagePath: document.storagePath,
        parsedContent: document.parsedContent,
        notes: document.notes,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        deletedAt: document.deletedAt,
      },
      update: {
        filename: document.filename,
        parsedContent: document.parsedContent,
        notes: document.notes,
        updatedAt: document.updatedAt,
        deletedAt: document.deletedAt,
      },
    });

    return saved;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.document.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch {
      // Silently handle if document doesn't exist
      // This matches the interface contract
    }
  }

  async search(reportId: string, query: string): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        reportId,
        deletedAt: null,
        OR: [
          { filename: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
          { parsedContent: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }
}
