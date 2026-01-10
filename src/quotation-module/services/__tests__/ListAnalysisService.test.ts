/**
 * Tests pour ListAnalysisService
 */

import { ListAnalysisService, ListAnalysisError } from '../ListAnalysisService';
import { createTestListAnalysisService, TEST_DATA } from '../test-helpers';

describe('ListAnalysisService', () => {
  let service: ListAnalysisService;

  beforeEach(() => {
    service = createTestListAnalysisService();
  });

  describe('analyzeList', () => {
    it('should analyze standard list and return volume', async () => {
      const result = await service.analyzeList(TEST_DATA.standardItems);

      expect(result.estimatedVolume).toBeGreaterThan(0);
      expect(result.confidence).toMatch(/LOW|MEDIUM|HIGH/);
      expect(result.detectedSpecialItems).toBeDefined();
    });

    it('should detect special items', async () => {
      const result = await service.analyzeList(TEST_DATA.itemsWithSpecial);

      expect(result.detectedSpecialItems.piano).toBe(true);
      expect(result.detectedSpecialItems.safe).toBe(true);
      expect(result.detectedSpecialItems.artwork).toBe(true);
    });

    it('should calculate volume from dimensions if provided', async () => {
      const items = [
        {
          name: 'Table',
          quantity: 1,
          dimensions: { length: 200, width: 100, height: 75 }, // cm
        },
      ];

      const result = await service.analyzeList(items);

      expect(result.estimatedVolume).toBeGreaterThan(0);
      expect(result.confidence).toBe('HIGH'); // Dimensions = haute confiance
    });

    it('should handle empty list', async () => {
      await expect(service.analyzeList([])).rejects.toThrow(ListAnalysisError);
    });

    it('should validate input', async () => {
      await expect(service.analyzeList(null as any)).rejects.toThrow(
        ListAnalysisError
      );
      await expect(service.analyzeList(undefined as any)).rejects.toThrow(
        ListAnalysisError
      );
    });

    it('should respect max items limit', async () => {
      const tooManyItems = Array.from({ length: 1001 }, (_, i) => ({
        name: `Item ${i}`,
        quantity: 1,
      }));

      await expect(service.analyzeList(tooManyItems)).rejects.toThrow(
        ListAnalysisError
      );
    });
  });
});

