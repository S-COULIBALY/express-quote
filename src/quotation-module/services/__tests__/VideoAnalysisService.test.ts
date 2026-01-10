/**
 * Tests pour VideoAnalysisService avec provider MOCK
 *
 * Ces tests utilisent le provider MOCK pour éviter les appels API réels
 */

import { VideoAnalysisService } from '../VideoAnalysisService';
import { createTestVideoAnalysisService, TEST_DATA } from '../test-helpers';

describe('VideoAnalysisService (MOCK)', () => {
  let service: VideoAnalysisService;

  beforeEach(() => {
    // Utiliser le helper pour créer un service avec MOCK
    service = createTestVideoAnalysisService();
  });

  describe('analyzeVideo', () => {
    it('should analyze video and return detected items', async () => {
      const result = await service.analyzeVideo(TEST_DATA.testVideoUrl);

      expect(result.estimatedVolume).toBeGreaterThan(0);
      expect(result.confidence).toMatch(/LOW|MEDIUM|HIGH/);
      expect(result.detectedItems).toBeInstanceOf(Array);
      expect(result.detectedItems.length).toBeGreaterThan(0);
    });

    it('should detect special items when present', async () => {
      const result = await service.analyzeVideo(TEST_DATA.testVideoUrlWithPiano);

      expect(result.detectedSpecialItems).toBeDefined();
      // Le mock devrait détecter le piano si l'URL contient "piano"
      if (TEST_DATA.testVideoUrlWithPiano.includes('piano')) {
        expect(result.detectedSpecialItems.piano).toBe(true);
      }
    });

    it('should return metadata with processing time', async () => {
      const result = await service.analyzeVideo(TEST_DATA.testVideoUrl);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
      expect(result.metadata.analysisMethod).toBe('AI_VISION');
      expect(result.metadata.provider).toBe('MOCK');
    });

    it('should handle multiple sample frames', async () => {
      const result = await service.analyzeVideo(TEST_DATA.testVideoUrl, {
        sampleFrames: 5,
      });

      // Avec plus de frames, on devrait avoir plus d'items détectés
      expect(result.detectedItems.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('startAnalysis (async)', () => {
    it('should start async analysis and return jobId', async () => {
      const { jobId, estimatedDurationMs } = await service.startAnalysis(
        TEST_DATA.testVideoUrl
      );

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
      expect(estimatedDurationMs).toBeGreaterThan(0);
    });

    it('should retrieve analysis result when completed', async () => {
      const { jobId } = await service.startAnalysis(TEST_DATA.testVideoUrl);

      // Attendre un peu pour que l'analyse se termine
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await service.getAnalysisResult(jobId);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.estimatedVolume).toBeGreaterThan(0);
        expect(result.detectedItems).toBeInstanceOf(Array);
      }
    });
  });

  describe('Error handling', () => {
    it('should validate video URL', async () => {
      await expect(service.analyzeVideo('')).rejects.toThrow();
      await expect(service.analyzeVideo('invalid-url')).rejects.toThrow();
    });

    it('should handle invalid URLs gracefully', async () => {
      await expect(
        service.analyzeVideo('ftp://invalid-protocol.com/video.mp4')
      ).rejects.toThrow();
    });
  });
});

