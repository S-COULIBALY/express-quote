import { NextRequest } from 'next/server';
import { PriceController } from '@/quotation/interfaces/http/controllers/PriceController';
import { devLog } from '@/lib/conditional-logger';

export async function POST(request: NextRequest) {
  devLog.debug('API', '📡 POST /api/price/calculate');

  try {
    const controller = new PriceController();
    const response = await controller.calculatePrice(request);
    devLog.debug('API', '✅ Requête terminée');
    return response;
  } catch (error) {
    devLog.error('API', '❌ Erreur API:', error);
    throw error;
  }
}