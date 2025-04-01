/**
 * Mocks pour les tests HTTP
 * 
 * Ce fichier contient les mocks pour les requêtes HTTP et des constantes de test.
 */

import { NextRequest } from 'next/server';
import { HttpRequest } from '@/quotation/interfaces/http/types';

/**
 * IDs de test pour les différents scénarios
 */
export const TEST_IDS = {
  // Pour les tests Moving
  MOVING: {
    BOOKING_ID: '2d9f7d8c-5b1a-4e7c-8f9a-3b2a1c4d5e6f',
    STRIPE_SESSION_ID: 'cs_test_moving123456789',
    CUSTOMER_ID: 'm-cust-2d9f7d8c-5b1a-4e7c-8f9a',
    MOVING_ID: 'm-det-2d9f7d8c-5b1a-4e7c-8f9a'
  },
  // Pour les tests Pack
  PACK: {
    BOOKING_ID: '3e0f8e9d-6c2b-5f8d-9g0b-4c3a2d5e6f7g',
    STRIPE_SESSION_ID: 'cs_test_pack123456789',
    CUSTOMER_ID: 'p-cust-3e0f8e9d-6c2b-5f8d-9g0b',
    PACK_ID: 'p-det-3e0f8e9d-6c2b-5f8d-9g0b'
  },
  // Pour les tests Service
  SERVICE: {
    BOOKING_ID: '4f1g9f0e-7d3c-6g9e-0h1c-5d4b3e6f7g8h',
    STRIPE_SESSION_ID: 'cs_test_service123456789',
    CUSTOMER_ID: 's-cust-4f1g9f0e-7d3c-6g9e-0h1c',
    SERVICE_ID: 's-det-4f1g9f0e-7d3c-6g9e-0h1c'
  }
};

/**
 * Mock de requête Next.js
 */
export class MockNextRequest implements HttpRequest {
  private requestUrl: string;
  private requestBody: any;
  private requestHeaders: Record<string, string | string[]>;
  
  constructor(
    url: string,
    body?: any,
    headers?: Record<string, string | string[]>
  ) {
    this.requestUrl = url;
    this.requestBody = body;
    this.requestHeaders = headers || {};
  }
  
  // Propriétés requises par l'interface HttpRequest
  get body(): any {
    return this.requestBody;
  }
  
  get params(): Record<string, string> {
    return {};
  }
  
  get query(): Record<string, string | string[]> {
    const searchParams = new URL(this.requestUrl).searchParams;
    const result: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  
  get headers(): Record<string, string | string[]> {
    return this.requestHeaders;
  }
  
  // Méthodes utilitaires pour les tests
  json(): Promise<any> {
    return Promise.resolve(this.requestBody);
  }
  
  getUrl(): string {
    return this.requestUrl;
  }
  
  getParam(name: string): string | null {
    const searchParams = new URL(this.requestUrl).searchParams;
    return searchParams.get(name);
  }
}

/**
 * Fonction utilitaire pour convertir MockNextRequest en NextRequest
 * Nécessaire pour les tests d'intégration avec l'API Next.js
 */
export function asNextRequest(mockReq: MockNextRequest): any {
  const url = mockReq.getUrl();
  const body = mockReq.body;
  const headers = mockReq.headers;
  
  // Dans les tests, nous créons un objet qui simule NextRequest
  // sans utiliser directement le constructeur NextRequest qui cause des problèmes
  const req = new Request(url, {
    method: 'POST',
    headers: headers as HeadersInit,
    body: body ? JSON.stringify(body) : undefined
  });
  
  // Ajouter les propriétés spécifiques à NextRequest
  (req as any).nextUrl = new URL(url);
  (req as any).json = () => Promise.resolve(body);
  (req as any).cookies = {
    get: jest.fn().mockReturnValue({ value: 'mock-cookie-value' }),
    getAll: jest.fn().mockReturnValue([{ value: 'mock-cookie-value' }]),
    set: jest.fn(),
    delete: jest.fn(),
  };
  
  return req;
}

/**
 * Création d'un événement Stripe de succès de paiement pour les tests
 */
export function createStripeSuccessEvent(bookingId: string, sessionId: string) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        metadata: {
          bookingId
        },
        status: 'complete',
        payment_status: 'paid'
      }
    }
  };
} 