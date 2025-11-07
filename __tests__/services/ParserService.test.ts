/**
 * ParserService Tests
 *
 * IMPORTANT: These tests focus on BEHAVIOR (parsing results),
 * not IMPLEMENTATION (API call details).
 *
 * @see docs/TDD-GUIDE.md - Section 3 (Service Layer Testing)
 */

// Mock fetch globally
global.fetch = jest.fn();

import { ParserService } from '@/services/ParserService';

describe('ParserService', () => {
  let service: ParserService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ParserService();
  });

  describe('parse', () => {
    it('should return placeholder for image files', async () => {
      const file = Buffer.from('fake image data');
      const filename = 'test.png';

      const result = await service.parse(file, filename);

      // ✅ Test BEHAVIOR: images are skipped with placeholder
      expect(result).toContain('Image file');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip parsing for all image extensions', async () => {
      const file = Buffer.from('data');

      const pngResult = await service.parse(file, 'test.png');
      const jpgResult = await service.parse(file, 'test.jpg');
      const jpegResult = await service.parse(file, 'test.jpeg');
      const gifResult = await service.parse(file, 'test.gif');

      // ✅ Test BEHAVIOR: all image types handled
      expect(pngResult).toContain('Image file');
      expect(jpgResult).toContain('Image file');
      expect(jpegResult).toContain('Image file');
      expect(gifResult).toContain('Image file');
    });

    it('should return empty string on parsing failure', async () => {
      const file = Buffer.from('PDF content');
      const filename = 'test.pdf';

      mockFetch.mockRejectedValue(new Error('API Error'));

      const result = await service.parse(file, filename);

      // ✅ Test BEHAVIOR: errors handled gracefully
      expect(result).toBe('');
    });
  });
});
