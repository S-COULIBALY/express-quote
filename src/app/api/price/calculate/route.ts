import { NextRequest } from 'next/server';
import { PriceController } from '@/quotation/interfaces/http/controllers/PriceController';

export async function POST(request: NextRequest) {
  const controller = new PriceController();
  return await controller.calculatePrice(request);
}