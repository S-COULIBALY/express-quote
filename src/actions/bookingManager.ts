'use server'

import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingItem, CatalogueMovingItem, CatalogueCleaningItem, CatalogueDeliveryItem } from '@/types/booking';

// Clé du cookie pour identifier la session de réservation
const BOOKING_SESSION_KEY = 'booking_session_id';

// Simuler une base de données en mémoire pour les besoins de la démonstration
// En production, cela serait remplacé par une base de données réelle
const bookingsDB = new Map<string, Booking>();
const bookingSessionsDB = new Map<string, string>();

// Fonction pour obtenir l'ID de réservation associé à la session actuelle
async function getBookingIdForCurrentSession(): Promise<string> {
  const cookieStore = cookies();
  let sessionId = cookieStore.get(BOOKING_SESSION_KEY)?.value;
  
  // Si aucun ID de session n'existe, en créer un nouveau
  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set(BOOKING_SESSION_KEY, sessionId, { 
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    });
  }
  
  // Récupérer l'ID de réservation associé à cette session
  let bookingId = bookingSessionsDB.get(sessionId);
  
  // Si aucune réservation n'est associée, créer une nouvelle réservation
  if (!bookingId) {
    bookingId = uuidv4();
    const newBooking: Booking = {
      id: bookingId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      hasInsurance: false,
      totalHT: 0,
      totalTTC: 0,
      status: 'draft'
    };
    
    bookingsDB.set(bookingId, newBooking);
    bookingSessionsDB.set(sessionId, bookingId);
    
    console.log(`Nouvelle réservation créée: ${bookingId} pour la session: ${sessionId}`);
  } else {
    console.log(`Réservation existante: ${bookingId} pour la session: ${sessionId}`);
  }
  
  return bookingId;
}

// Fonction pour obtenir la réservation actuelle
export async function getCurrentBooking(): Promise<Booking | null> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  // Log pour le débogage
  console.log(`Récupération de la réservation ${bookingId}, statut: ${booking?.status}`);
  
  return booking || null;
}

// Fonction pour récupérer une réservation par ID
export async function getBookingById(id: string): Promise<Booking | null> {
  const booking = bookingsDB.get(id);
  
  // Log pour le débogage
  console.log(`Récupération de la réservation par ID ${id}, trouvée: ${!!booking}, statut: ${booking?.status}`);
  
  return booking || null;
}

// Fonction pour ajouter un pack à la réservation
export async function addCatalogueMovingItemToBooking(pack: CatalogueMovingItem): Promise<Booking> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Mettre à jour l'ID de réservation dans le pack
  const packWithBookingId: CatalogueMovingItem = {
    ...pack,
    bookingId,
    serviceType: pack.serviceType || 'PACK'
  };
  
  // Créer un nouvel élément de réservation
  const bookingItem: BookingItem = {
    id: uuidv4(),
    type: 'pack',
    itemId: pack.id,
    data: packWithBookingId,
    price: pack.price,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Ajouter l'élément à la réservation
  booking.items.push(bookingItem);
  booking.updatedAt = new Date();
  
  // Recalculer les totaux (à implémenter avec priceCalculator)
  await updateBookingTotals(booking);
  
  return booking;
}

// Fonction pour ajouter un service à la réservation
export async function addCatalogueCleaningItemToBooking(service: CatalogueCleaningItem): Promise<Booking> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Mettre à jour l'ID de réservation dans le service
  const serviceWithBookingId: CatalogueCleaningItem = {
    ...service,
    bookingId,
    serviceType: service.serviceType || 'SERVICE'
  };
  
  // Créer un nouvel élément de réservation
  const bookingItem: BookingItem = {
    id: uuidv4(),
    type: 'service',
    itemId: service.id,
    data: serviceWithBookingId,
    price: service.price,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Ajouter l'élément à la réservation
  booking.items.push(bookingItem);
  booking.updatedAt = new Date();
  
  // Recalculer les totaux
  await updateBookingTotals(booking);
  
  return booking;
}

// Fonction pour ajouter une livraison à la réservation
export async function addCatalogueDeliveryItemToBooking(delivery: CatalogueDeliveryItem): Promise<Booking> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Mettre à jour l'ID de réservation dans la livraison
  const deliveryWithBookingId: CatalogueDeliveryItem = {
    ...delivery,
    bookingId
  };
  
  // Créer un nouvel élément de réservation
  const bookingItem: BookingItem = {
    id: uuidv4(),
    type: 'delivery',
    itemId: delivery.id,
    data: deliveryWithBookingId,
    price: delivery.price,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Ajouter l'élément à la réservation
  booking.items.push(bookingItem);
  booking.updatedAt = new Date();
  
  // Recalculer les totaux
  await updateBookingTotals(booking);
  
  return booking;
}

// Fonction pour supprimer un élément de la réservation
export async function removeItemFromBooking(itemId: string): Promise<Booking> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Filtrer l'élément à supprimer
  booking.items = booking.items.filter(item => item.id !== itemId);
  booking.updatedAt = new Date();
  
  // Recalculer les totaux
  await updateBookingTotals(booking);
  
  return booking;
}

// Fonction pour mettre à jour l'option d'assurance
export async function updateInsuranceOption(hasInsurance: boolean): Promise<Booking> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  booking.hasInsurance = hasInsurance;
  booking.updatedAt = new Date();
  
  // Recalculer les totaux
  await updateBookingTotals(booking);
  
  return booking;
}

// Fonction privée pour recalculer les totaux de la réservation
// Cette fonction utilise maintenant le système de strategy pour le calcul
async function updateBookingTotals(booking: Booking): Promise<void> {
  // TODO: Implémenter le recalcul avec le pattern strategy
  // Pour l'instant, on garde des totaux par défaut
  booking.totalHT = 0;
  booking.totalTTC = 0;
}

// Fonction pour valider et confirmer une réservation
export async function confirmBooking(customerData: any): Promise<{ bookingId: string, success: boolean }> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking || booking.items.length === 0) {
    throw new Error('Booking is empty or not found');
  }
  
  // Mettre à jour le statut de la réservation
  booking.status = 'confirmed';
  booking.customerData = customerData;
  booking.confirmedAt = new Date();
  booking.updatedAt = new Date();
  
  // En production, sauvegarder dans une vraie base de données ici
  
  // Libérer la session de réservation pour en commencer une nouvelle
  const cookieStore = cookies();
  const sessionId = cookieStore.get(BOOKING_SESSION_KEY)?.value;
  if (sessionId) {
    bookingSessionsDB.delete(sessionId);
    // Garder le cookie mais la prochaine utilisation créera une nouvelle réservation
  }
  
  return {
    bookingId,
    success: true
  };
}

// Fonction pour ajouter un item personnalisé à la réservation
export async function addPersonalizedItemToBooking(itemId: string): Promise<Booking> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Récupérer l'item personnalisé depuis l'API
  const itemResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/items/${itemId}`);
  
  if (!itemResponse.ok) {
    throw new Error('Item personnalisé non trouvé');
  }
  
  const personalizedItem = await itemResponse.json();
  
  // Créer un nouvel élément de réservation
  const bookingItem: BookingItem = {
    id: uuidv4(),
    type: 'personalizedItem',
    itemId: personalizedItem.id,
    data: personalizedItem,
    price: personalizedItem.price,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Ajouter l'élément à la réservation
  booking.items.push(bookingItem);
  booking.updatedAt = new Date();
  
  // Recalculer les totaux
  await updateBookingTotals(booking);
  
  return booking;
}

// Fonction pour finaliser une réservation avant paiement
export async function finalizeBooking(): Promise<{ bookingId: string, success: boolean }> {
  const bookingId = await getBookingIdForCurrentSession();
  const booking = bookingsDB.get(bookingId);
  
  if (!booking || booking.items.length === 0) {
    throw new Error('Réservation vide ou introuvable');
  }
  
  // S'assurer que la réservation est complète avant de permettre le paiement
  const isServiceBooking = booking.items.some(item => item.type === 'service');
  const isPackBooking = booking.items.some(item => item.type === 'pack');
  
  if (!isServiceBooking && !isPackBooking) {
    throw new Error('La réservation ne contient ni service ni pack');
  }
  
  // Mettre à jour le statut de la réservation
  booking.status = 'awaiting_payment';
  booking.updatedAt = new Date();
  
  // En production, sauvegarder dans une vraie base de données ici
  // IMPORTANT: Ne pas effacer l'association session-réservation
  console.log(`Finalisation de la réservation ${bookingId}, statut: ${booking.status}`);
  
  return {
    bookingId,
    success: true
  };
} 