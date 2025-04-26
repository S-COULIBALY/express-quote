import { useState } from 'react';

/**
 * Hook personnalisé pour gérer les interactions avec l'API des réservations
 * Remplace les anciennes fonctions du bookingManager.ts
 */
export function useBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère la réservation courante
   */
  const getCurrentBooking = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bookings/current', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error("Erreur lors de la récupération de la réservation:", errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Ajoute un service à la réservation courante
   */
  const addServiceToBooking = async (serviceData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Vérifier si une réservation existe déjà
      const currentBooking = await getCurrentBooking();
      const bookingId = currentBooking?.id;
      
      if (!bookingId) {
        // Créer une nouvelle réservation
        const createResponse = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SERVICE',
            status: 'DRAFT'
          })
        });
        
        if (!createResponse.ok) {
          throw new Error(`Erreur lors de la création de la réservation: ${createResponse.status}`);
        }
        
        const newBooking = await createResponse.json();
        return addServiceToExistingBooking(newBooking.id, serviceData);
      }
      
      return addServiceToExistingBooking(bookingId, serviceData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error("Erreur lors de l'ajout du service:", errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Ajoute un service à une réservation existante
   */
  const addServiceToExistingBooking = async (bookingId: string, serviceData: any) => {
    const response = await fetch(`/api/bookings/${bookingId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return response.json();
  };

  /**
   * Met à jour l'option d'assurance
   */
  const updateInsuranceOption = async (hasInsurance: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentBooking = await getCurrentBooking();
      if (!currentBooking?.id) {
        throw new Error('Aucune réservation trouvée');
      }
      
      const response = await fetch(`/api/bookings/${currentBooking.id}/insurance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasInsurance })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error("Erreur lors de la mise à jour de l'assurance:", errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    getCurrentBooking, 
    addServiceToBooking,
    updateInsuranceOption,
    isLoading,
    error
  };
} 