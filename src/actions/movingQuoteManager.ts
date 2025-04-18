'use server'

import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import type { MovingFormData } from '@/types/quote'
import type { QuoteDetails } from '@/types/quote'

// Simuler une base de données avec une Map
const movingQuotesDB = new Map<string, any>()
const quoteSessionsDB = new Map<string, string>()

// Clé du cookie pour identifier la session
const MOVING_QUOTE_SESSION_KEY = 'moving_quote_session_id'

/**
 * Obtient l'ID de devis associé à la session actuelle ou en crée un nouveau
 */
async function getQuoteIdForCurrentSession(): Promise<string> {
  const cookieStore = cookies()
  let sessionId = cookieStore.get(MOVING_QUOTE_SESSION_KEY)?.value
  
  // Si aucun ID de session n'existe, en créer un nouveau
  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set(MOVING_QUOTE_SESSION_KEY, sessionId, { 
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    })
  }
  
  // Récupérer l'ID de devis associé à cette session
  let quoteId = quoteSessionsDB.get(sessionId)
  
  // Si aucun devis n'est associé, créer un nouveau devis
  if (!quoteId) {
    quoteId = uuidv4()
    const newQuote = {
      id: quoteId,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    movingQuotesDB.set(quoteId, newQuote)
    quoteSessionsDB.set(sessionId, quoteId)
  }
  
  return quoteId
}

/**
 * Obtient le devis actuel
 */
export async function getCurrentMovingQuote(): Promise<any | null> {
  const quoteId = await getQuoteIdForCurrentSession()
  return movingQuotesDB.get(quoteId) || null
}

/**
 * Met à jour ou crée un devis de déménagement
 */
export async function saveMovingQuote(
  formData: MovingFormData,
  quoteDetails: QuoteDetails,
  pickupCoordinates?: { lat: number, lng: number },
  deliveryCoordinates?: { lat: number, lng: number },
  messages?: any[]
): Promise<{ id: string, success: boolean }> {
  try {
    const quoteId = await getQuoteIdForCurrentSession()
    const existingQuote = movingQuotesDB.get(quoteId) || {}
    
    // Préparer les données du devis
    const quoteData = {
      ...existingQuote,
      id: quoteId,
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      volume: typeof formData.volume === 'string' ? parseFloat(formData.volume) || 0 : formData.volume || 0,
      options: formData.options || {},
      preferredDate: formData.movingDate,
      preferredTime: formData.preferredTime || 'morning',
      
      // Détails des adresses
      pickupFloor: typeof formData.pickupFloor === 'string' 
        ? parseInt(formData.pickupFloor) || 0 
        : formData.pickupFloor || 0,
      pickupElevator: formData.pickupElevator,
      pickupCarryDistance: typeof formData.pickupCarryDistance === 'string'
        ? parseInt(formData.pickupCarryDistance) || 0
        : formData.pickupCarryDistance || 0,
      deliveryFloor: typeof formData.deliveryFloor === 'string' 
        ? parseInt(formData.deliveryFloor) || 0 
        : formData.deliveryFloor || 0,
      deliveryElevator: formData.deliveryElevator,
      deliveryCarryDistance: typeof formData.deliveryCarryDistance === 'string'
        ? parseInt(formData.deliveryCarryDistance) || 0
        : formData.deliveryCarryDistance || 0,
      
      // Informations du logement
      propertyType: formData.propertyType,
      surface: formData.surface,
      rooms: formData.rooms,
      occupants: formData.occupants,
      
      // Détails du calcul
      distance: quoteDetails.distance || 0,
      totalCost: quoteDetails.totalCost || 0,
      baseCost: quoteDetails.baseCost || 0,
      volumeCost: quoteDetails.volumeCost || 0,
      distancePrice: quoteDetails.distancePrice || 0,
      tollCost: quoteDetails.tollCost || 0,
      fuelCost: quoteDetails.fuelCost || 0,
      optionsCost: quoteDetails.optionsCost || 0,
      signature: quoteDetails.signature || '',
      
      // Coordonnées géographiques
      pickupCoordinates,
      deliveryCoordinates,
      
      // Historique des messages
      messages: messages || [],
      
      // Métadonnées
      status: 'draft',
      updatedAt: new Date()
    }
    
    // Sauvegarder le devis dans notre "base de données"
    movingQuotesDB.set(quoteId, quoteData)
    
    // En production, vous feriez ici un appel à votre vraie API ou base de données
    // pour persister les données
    
    // Simulons un appel API pour enregistrer les données sur le serveur
    try {
      // Ceci serait un appel à votre API réelle
      const serverResponse = await submitToServerAPI(quoteData)
      
      // Si l'API a généré un nouvel ID, mettons à jour notre référence
      if (serverResponse && serverResponse.id && serverResponse.id !== quoteId) {
        const cookieStore = cookies()
        const sessionId = cookieStore.get(MOVING_QUOTE_SESSION_KEY)?.value
        if (sessionId) {
          quoteSessionsDB.set(sessionId, serverResponse.id)
          
          // Créer une copie dans notre base de données simulée
          movingQuotesDB.set(serverResponse.id, {
            ...quoteData,
            id: serverResponse.id,
            serverSync: true
          })
        }
        
        return {
          id: serverResponse.id,
          success: true
        }
      }
    } catch (apiError) {
      console.error('Erreur lors de la synchronisation avec le serveur:', apiError)
      // Continuer avec l'ID local car nous avons déjà sauvegardé localement
    }
    
    return {
      id: quoteId,
      success: true
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du devis:', error)
    return {
      id: '',
      success: false
    }
  }
}

/**
 * Confirme un devis de déménagement et le convertit en commande
 */
export async function confirmMovingQuote(
  customerData: any
): Promise<{ orderId: string, success: boolean }> {
  try {
    const quoteId = await getQuoteIdForCurrentSession()
    const quote = movingQuotesDB.get(quoteId)
    
    if (!quote) {
      throw new Error('Devis non trouvé')
    }
    
    // Mettre à jour le devis
    const updatedQuote = {
      ...quote,
      status: 'confirmed',
      customerData,
      confirmedAt: new Date(),
      updatedAt: new Date()
    }
    
    // Sauvegarder dans notre "base de données"
    movingQuotesDB.set(quoteId, updatedQuote)
    
    // En production, vous feriez ici un appel à votre vraie API pour confirmer la commande
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    return {
      orderId,
      success: true
    }
  } catch (error) {
    console.error('Erreur lors de la confirmation du devis:', error)
    return {
      orderId: '',
      success: false
    }
  }
}

/**
 * Fonction simulant un appel à l'API serveur pour synchroniser les données
 * Dans un projet réel, cette fonction ferait un vrai appel HTTP à votre API
 */
async function submitToServerAPI(quoteData: any): Promise<{ id: string } | null> {
  try {
    // Dans un cas réel, vous feriez ici l'appel à votre API 
    // et utiliseriez les mécanismes d'authentification appropriés
    // Exemple:
    // const response = await fetch('/api/moving', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(quoteData)
    // })
    
    // Si nous avons une API réelle configurée, nous pouvons l'utiliser ici
    const apiUrl = process.env.MOVING_QUOTE_API_URL || '/api/moving'
    
    if (apiUrl) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quoteData),
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          return data
        }
      } catch (apiError) {
        console.error('Erreur API réelle:', apiError)
      }
    }
    
    // Simulation d'une réponse serveur
    return {
      id: `SVR-${quoteData.id}`
    }
  } catch (error) {
    console.error('Erreur lors de la soumission à l\'API:', error)
    return null
  }
} 