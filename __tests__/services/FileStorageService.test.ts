/**
 * FileStorageService Tests
 *
 * IMPORTANT: These tests focus on BEHAVIOR (file operations work correctly),
 * not IMPLEMENTATION (how fs module is called).
 *
 * @see docs/TDD-GUIDE.md - Section 3 (Service Layer Testing)
 */

// Mock fs/promises module BEFORE imports
const mockMkdir = jest.fn();
const mockWriteFile = jest.fn();
const mockReadFile = jest.fn();
const mockUnlink = jest.fn();
const mockAccess = jest.fn();

jest.mock('fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  readFile: mockReadFile,
  unlink: mockUnlink,
  access: mockAccess,
}));

import { FileStorageService } from '@/services/FileStorageService';

describe('FileStorageService', () => {
  let service: FileStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FileStorageService();
  });

  describe('saveFile', () => {
    it('should save file and return storage path', async () => {
      const reportId = 'report-123';
      const fileHash = 'abc123def456';
      const filename = 'test.pdf';
      const fileBuffer = Buffer.from('file content');

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const result = await service.saveFile(
        reportId,
        fileHash,
        fileBuffer,
        filename,
      );

      // ✅ Test BEHAVIOR: should return storage path
      expect(result).toBeDefined();
      expect(result).toContain(reportId);
      expect(result).toContain(fileHash);
      expect(result).toContain('.pdf');
    });

    it('should preserve file extension', async () => {
      const fileBuffer = Buffer.from('content');

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const pdfPath = await service.saveFile(
        'report-1',
        'hash1',
        fileBuffer,
        'doc.pdf',
      );
      const txtPath = await service.saveFile(
        'report-2',
        'hash2',
        fileBuffer,
        'doc.txt',
      );
      const mdPath = await service.saveFile(
        'report-3',
        'hash3',
        fileBuffer,
        'doc.md',
      );

      // ✅ Test BEHAVIOR: file extensions preserved
      expect(pdfPath).toMatch(/\.pdf$/);
      expect(txtPath).toMatch(/\.txt$/);
      expect(mdPath).toMatch(/\.md$/);
    });

    it('should handle File objects', async () => {
      const reportId = 'report-123';
      const fileHash = 'abc123';
      const filename = 'test.txt';

      // Mock File object (browser API)
      const mockFile = {
        arrayBuffer: jest.fn().mockResolvedValue(
          new ArrayBuffer(11), // "file content" length
        ),
      } as unknown as File;

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const result = await service.saveFile(
        reportId,
        fileHash,
        mockFile,
        filename,
      );

      // ✅ Test BEHAVIOR: File objects are handled
      expect(result).toBeDefined();
      expect(mockFile.arrayBuffer).toHaveBeenCalled();
    });
  });

  // Note: getFile() is a simple pass-through to fs.readFile()
  // It will be tested via integration tests in Phase 3

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const storagePath = '/storage/report-123/abc123.pdf';

      mockUnlink.mockResolvedValue(undefined);

      // ✅ Test BEHAVIOR: deletion completes without error
      await expect(service.deleteFile(storagePath)).resolves.not.toThrow();
    });

    it('should not throw error when file does not exist', async () => {
      const storagePath = '/storage/nonexistent.pdf';

      mockUnlink.mockRejectedValue(new Error('ENOENT: no such file'));

      // ✅ Test BEHAVIOR: graceful handling of missing files
      await expect(service.deleteFile(storagePath)).resolves.not.toThrow();
    });
  });
});
