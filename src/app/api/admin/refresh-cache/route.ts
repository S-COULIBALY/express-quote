import { NextResponse } from 'next/server';
import { ConfigurationCacheService } from '@/quotation/infrastructure/services/ConfigurationCacheService';

/**
 * POST /api/admin/refresh-cache
 * Rafraîchit le cache des configurations
 */
export async function POST() {
  try {
    const cacheService = ConfigurationCacheService.getInstance();
    await cacheService.invalidateCache();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache rafraîchi avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du cache:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du rafraîchissement du cache' },
      { status: 500 }
    );
  }
} 