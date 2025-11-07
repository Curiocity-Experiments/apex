/**
 * FileStorageService
 *
 * Handles file storage operations (save, retrieve, delete).
 * Stores files locally in the configured storage directory.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 2: File Storage Service
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 4.3 (Service Layer)
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export class FileStorageService {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH || './storage';
  }

  /**
   * Save a file to storage
   * @param reportId - Report ID (used for directory structure)
   * @param fileHash - SHA-256 hash of file content (used for deduplication)
   * @param file - File content (Buffer or File object)
   * @param filename - Original filename (used to preserve extension)
   * @returns Storage path where file was saved
   */
  async saveFile(
    reportId: string,
    fileHash: string,
    file: File | Buffer,
    filename: string,
  ): Promise<string> {
    // Create directory structure: storage/reportId/
    const dir = path.join(this.basePath, reportId);
    await fs.mkdir(dir, { recursive: true });

    // Get file extension from original filename
    const ext = path.extname(filename);

    // Storage path: storage/reportId/fileHash.ext
    const storagePath = path.join(dir, `${fileHash}${ext}`);

    // Convert File to Buffer if needed
    const buffer =
      file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());

    // Write file to disk
    await fs.writeFile(storagePath, buffer);

    return storagePath;
  }

  /**
   * Retrieve a file from storage
   * @param storagePath - Full path to stored file
   * @returns File content as Buffer
   */
  async getFile(storagePath: string): Promise<Buffer> {
    return await fs.readFile(storagePath);
  }

  /**
   * Delete a file from storage
   * Gracefully handles missing files (no error thrown)
   * @param storagePath - Full path to stored file
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      await fs.unlink(storagePath);
    } catch {
      // Ignore errors (file may already be deleted)
      // This is intentional - deleting a non-existent file is not an error
    }
  }

  /**
   * Check if a file exists
   * @param storagePath - Full path to check
   * @returns true if file exists, false otherwise
   */
  async fileExists(storagePath: string): Promise<boolean> {
    try {
      await fs.access(storagePath);
      return true;
    } catch {
      return false;
    }
  }
}
