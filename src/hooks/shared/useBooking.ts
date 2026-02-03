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
  const addCatalogueCleaningItemToBooking = async (serviceData: any) => {
    console.log('🚀 [useBooking] Début de addCatalogueCleaningItemToBooking');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📝 [useBooking] Données du service:', serviceData);
      
      // Vérifier si une réservation existe déjà
      console.log('🔍 [useBooking] Vérification de la réservation courante...');
      const currentBooking = await getCurrentBooking();
      const bookingId = currentBooking?.id;
      
      console.log('📋 [useBooking] Réservation courante:', { bookingId, currentBooking });
      
      if (!bookingId) {
        // Créer une nouvelle réservation
        console.log('➕ [useBooking] Création d\'une nouvelle réservation...');
        
        // Déterminer le type de service à partir des données
        let serviceType = 'MOVING'; // Seul service actif
        
        // Legacy: catégories anciennes mappées vers MOVING
        const categoryMapping: { [key: string]: string } = {
          'DEMENAGEMENT': 'MOVING',
          'MENAGE': 'MOVING',
          'MOVING': 'MOVING'
        };
        
        if (serviceData?.category && categoryMapping[serviceData.category]) {
          serviceType = categoryMapping[serviceData.category];
        } else if (serviceData?.serviceType) {
          serviceType = serviceData.serviceType;
        }
        
        console.log('📋 [useBooking] Type de service déterminé:', serviceType);
        console.log('📋 [useBooking] Catégorie originale:', serviceData?.category);
        
        const createResponse = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: serviceType,
            data: serviceData || {},
            status: 'DRAFT'
          })
        });
        
        console.log('📨 [useBooking] Réponse création réservation:', {
          status: createResponse.status,
          ok: createResponse.ok,
          statusText: createResponse.statusText
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('❌ [useBooking] Erreur création réservation:', errorText);
          throw new Error(`Erreur lors de la création de la réservation: ${createResponse.status} - ${errorText}`);
        }
        
        const newBooking = await createResponse.json();
        console.log('✅ [useBooking] Nouvelle réservation créée:', newBooking);
        return addServiceToExistingBooking(newBooking.id, serviceData);
      }
      
      console.log('📎 [useBooking] Ajout du service à la réservation existante:', bookingId);
      return addServiceToExistingBooking(bookingId, serviceData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error("❌ [useBooking] Erreur lors de l'ajout du service:", {
        error,
        errorMessage,
        serviceData
      });
      
      setError(errorMessage);
      throw error;
    } finally {
      console.log('🔄 [useBooking] Fin de addCatalogueCleaningItemToBooking');
      setIsLoading(false);
    }
  };
  
  /**
   * Ajoute un service à une réservation existante
   */
  const addServiceToExistingBooking = async (bookingId: string, serviceData: any) => {
    console.log('🔗 [useBooking] Ajout service à réservation existante:', {
      bookingId,
      serviceData
    });
    
    const apiUrl = `/api/bookings/${bookingId}/services`;
    console.log('🌐 [useBooking] Appel API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    
    console.log('📨 [useBooking] Réponse API:', {
      url: apiUrl,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ [useBooking] Erreur API (JSON):', errorData);
      } catch (parseError) {
        const errorText = await response.text();
        console.error('❌ [useBooking] Erreur API (text):', errorText);
        console.error('❌ [useBooking] Erreur parsing JSON:', parseError);
        throw new Error(`Erreur ${response.status}: ${errorText || response.statusText}`);
      }
      
      throw new Error(errorData.message || `Erreur ${response.status}: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ [useBooking] Service ajouté avec succès:', result);
    return result;
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
    addCatalogueCleaningItemToBooking,
    updateInsuranceOption,
    isLoading,
    error
  };
} 