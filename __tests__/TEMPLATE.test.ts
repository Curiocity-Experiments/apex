/**
 * [Feature Name] Tests
 *
 * Testing [what this tests].
 *
 * IMPORTANT: Focus on BEHAVIOR (what is returned),
 * not IMPLEMENTATION (how it's done).
 *
 * Reference: docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { FeatureUnderTest } from '@/path/to/feature';
import { mockDependency } from '@/__tests__/utils/mocks';

describe.skip('FeatureUnderTest', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks
  });

  describe('methodName', () => {
    it('should [behavior description]', async () => {
      // Arrange: Set up test data
      const mockData = {
        /* ... */
      };
      mockDependency.method.mockResolvedValue(mockData);

      // Act: Execute method
      const result = await featureUnderTest.methodName();

      // Assert: Verify BEHAVIOR (what was returned)
      expect(result).toHaveProperty('expectedProperty');
      expect(result.value).toBe('expectedValue');

      // ✅ GOOD: Testing returned data
      // ❌ BAD: expect(mockDependency.method).toHaveBeenCalledWith(...)
    });

    it('should handle error case', async () => {
      // Arrange: Set up error condition
      mockDependency.method.mockRejectedValue(new Error('Test error'));

      // Act & Assert: Verify error handling behavior
      await expect(featureUnderTest.methodName()).rejects.toThrow('Test error');
    });
  });
});
