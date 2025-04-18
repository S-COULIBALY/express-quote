export interface BookingData {
  id: string;
  type: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  totalAmount: number;
  totalHT?: number;
  totalTTC?: number;
}

import { getCurrentBooking } from '@/actions/bookingManager';

export class BookingService {
  static async getBookingById(id: string): Promise<BookingData | null> {
    // Simuler une API dans ce prototype
    // À remplacer par un vrai appel API quand elle sera disponible
    try {
      // Utiliser getCurrentBooking au lieu de localStorage
      const currentBooking = await getCurrentBooking();
      
      // Si l'ID correspond, retourner les données
      if (currentBooking && currentBooking.id === id) {
        return {
          id: currentBooking.id,
          type: currentBooking.items && currentBooking.items.length > 0 ? currentBooking.items[0].type : 'UNKNOWN',
          status: 'confirmed',
          customer: currentBooking.customer || {
            firstName: '',
            lastName: '',
            email: ''
          },
          totalAmount: currentBooking.totalHT || 0,
          totalHT: currentBooking.totalHT || 0,
          totalTTC: currentBooking.totalTTC || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la réservation:', error);
      return null;
    }
  }
} 