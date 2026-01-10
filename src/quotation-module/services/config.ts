/**
 * Configuration des services d'analyse de volume
 *
 * Variables d'environnement requises pour la production
 */

export interface VolumeAnalysisConfig {
  // Video Analysis
  videoAnalysisProvider: 'OPENAI' | 'GOOGLE' | 'CUSTOM' | 'MOCK';
  openaiApiKey?: string;
  googleVisionApiKey?: string;
  
  // Timeouts
  videoAnalysisTimeoutMs: number;
  maxVideoDurationSeconds: number;
  
  // Retry
  maxRetries: number;
  retryDelayMs: number;
  
  // Limits
  maxListItems: number;
  maxVolumePerItem: number;
  minVolume: number;
  maxVolume: number;
}

/**
 * Configuration par défaut avec valeurs de production
 */
export const defaultConfig: VolumeAnalysisConfig = {
  videoAnalysisProvider: (process.env.VIDEO_ANALYSIS_PROVIDER as any) || 'OPENAI', // OpenAI par défaut
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
  
  videoAnalysisTimeoutMs: parseInt(process.env.VIDEO_ANALYSIS_TIMEOUT_MS || '120000', 10), // 2 min
  maxVideoDurationSeconds: parseInt(process.env.MAX_VIDEO_DURATION_SECONDS || '300', 10), // 5 min
  
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
  
  maxListItems: parseInt(process.env.MAX_LIST_ITEMS || '1000', 10),
  maxVolumePerItem: parseInt(process.env.MAX_VOLUME_PER_ITEM || '50', 10),
  minVolume: parseFloat(process.env.MIN_VOLUME || '0.1'),
  maxVolume: parseFloat(process.env.MAX_VOLUME || '500'),
};

/**
 * Valide la configuration pour la production
 */
export function validateConfig(config: VolumeAnalysisConfig = defaultConfig): void {
  const errors: string[] = [];

  if (config.videoAnalysisProvider === 'OPENAI' && !config.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required when using OpenAI provider');
  }

  if (config.videoAnalysisProvider === 'GOOGLE' && !config.googleVisionApiKey) {
    errors.push('GOOGLE_VISION_API_KEY is required when using Google provider');
  }

  if (config.videoAnalysisProvider === 'MOCK' && process.env.NODE_ENV === 'production') {
    errors.push('MOCK provider should not be used in production');
  }

  if (config.videoAnalysisProvider === 'OPENAI' && !config.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required when using OpenAI provider (default)');
  }

  if (config.videoAnalysisTimeoutMs < 10000) {
    errors.push('videoAnalysisTimeoutMs must be at least 10000ms');
  }

  if (config.maxRetries < 0 || config.maxRetries > 10) {
    errors.push('maxRetries must be between 0 and 10');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

