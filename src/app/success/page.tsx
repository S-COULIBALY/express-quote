'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface BookingData {
  id: string;
  type: string;
  status: string;
  totalAmount: number;
  depositAmount?: number; // Acompte payé (30%)
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

/**
 * Page de succès après paiement réussi
 * Attend la création du Booking par le webhook, puis affiche les détails
 */
export default function SuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');

  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Vérification du paiement...');
  const [attempts, setAttempts] = useState(0);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const attemptsRef = useRef(0); // Ref pour suivre les tentatives sans dépendre de la closure
  const isCheckingRef = useRef(false); // Flag pour éviter les appels multiples simultanés
  const MAX_ATTEMPTS = 20; // 20 tentatives = 20 secondes

  useEffect(() => {
    if (!paymentIntentId) {
      setStatus('error');
      setMessage('Identifiant de paiement manquant');
      return;
    }

    // Réinitialiser les tentatives à chaque nouveau paymentIntentId
    setAttempts(0);
    attemptsRef.current = 0;
    isCheckingRef.current = false;
    
    // Nettoyer les timeouts précédents si le composant se remonte
    const timeoutId = setTimeout(() => {
      if (!isCheckingRef.current) {
        isCheckingRef.current = true;
        checkPaymentAndBooking();
      }
    }, 100); // Petit délai pour éviter les appels multiples lors du hot-reload

    return () => {
      clearTimeout(timeoutId);
      isCheckingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIntentId]);

  const checkPaymentAndBooking = async () => {
    // Cette fonction est appelée uniquement quand isCheckingRef.current est true
    // Pas besoin de vérifier à nouveau ici

    try {
      const currentAttempt = attemptsRef.current + 1;
      attemptsRef.current = currentAttempt;

      // Vérifier si le Booking a été créé via le webhook
      const url = `/api/payment/status?payment_intent=${paymentIntentId}`;

      const response = await fetch(url);

      // Lire le corps de la réponse
      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Réponse API invalide (non-JSON)');
      }

      if (response.ok) {
        if (data.success && data.bookingId) {
          // Booking créé ! Récupérer les détails et afficher
          try {
            const bookingResponse = await fetch(`/api/bookings/${data.bookingId}`);
            if (bookingResponse.ok) {
              const bookingData = await bookingResponse.json();
              
              // Structure standardisée : { success: true, data: { id: ..., ... } }
              if (bookingData.success && bookingData.data && bookingData.data.id) {
                isCheckingRef.current = false; // Arrêter les vérifications
                setBooking(bookingData.data);
                setStatus('success');
                setMessage('Paiement confirmé !');
                
                return;
              }
            }
            // Si erreur récupération booking, afficher quand même le succès
            setStatus('success');
            setMessage('Paiement confirmé ! Vous recevrez un email de confirmation.');
          } catch (bookingError) {
            setStatus('success');
            setMessage('Paiement confirmé ! Vous recevrez un email de confirmation.');
          }
          return;
        }
      } else if (response.status === 202) {
        // 202 = En cours de traitement
      } else {
        // Erreur HTTP - afficher les détails
        // Afficher le message d'erreur de l'API
        const errorMessage = data?.message || data?.error || response.statusText;
        const errorDetails = data?.details ? JSON.stringify(data.details) : '';

        setStatus('error');
        setMessage(`Erreur: ${errorMessage}. ${errorDetails ? 'Détails: ' + errorDetails : ''}`);
        return;
      }

      // Le Booking n'est pas encore créé, réessayer
      if (currentAttempt < MAX_ATTEMPTS) {
        setAttempts(currentAttempt);
        setMessage(`Traitement de votre paiement en cours... (${currentAttempt}/${MAX_ATTEMPTS})`);

        setTimeout(() => {
          // Vérifier que le statut n'a pas changé entre-temps (via ref pour éviter closure)
          if (isCheckingRef.current) {
            checkPaymentAndBooking();
          }
        }, 1000); // Réessayer après 1 seconde
      } else if (currentAttempt >= MAX_ATTEMPTS) {
        // Timeout : le webhook prend trop de temps
        isCheckingRef.current = false;
        setStatus('error');
        setMessage('Le traitement prend plus de temps que prévu. Vous recevrez un email de confirmation.');
      }

    } catch (error) {
      const errorAttempt = attemptsRef.current;
      if (errorAttempt < MAX_ATTEMPTS) {
        setAttempts(errorAttempt);
        setTimeout(() => {
          // Vérifier que le statut n'a pas changé entre-temps (via ref pour éviter closure)
          if (isCheckingRef.current) {
            checkPaymentAndBooking();
          }
        }, 1000);
      } else {
        isCheckingRef.current = false;
        setStatus('error');
        setMessage('Erreur de connexion. Vous recevrez un email de confirmation.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'checking' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Paiement en cours</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(attempts / MAX_ATTEMPTS) * 100}%` }}
              ></div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
              <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-emerald-600">Paiement confirmé !</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            {booking && booking.id ? (
              <>
                <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Référence:</span>
                    <span className="font-semibold">EQ-{booking.id.slice(-8).toUpperCase()}</span>
                  </div>
                  {booking.depositAmount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Acompte payé (30%):</span>
                      <span className="font-semibold text-emerald-600">{typeof booking.depositAmount === 'number' ? booking.depositAmount.toFixed(2) : booking.depositAmount} €</span>
                    </div>
                  )}
                  {booking.totalAmount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant total:</span>
                      <span className="font-semibold">{typeof booking.totalAmount === 'number' ? booking.totalAmount.toFixed(2) : booking.totalAmount} €</span>
                    </div>
                  )}
                  {booking.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-sm font-medium">
                        {booking.status === 'CONFIRMED' || booking.status === 'PAYMENT_COMPLETED' ? 'Confirmé' : booking.status}
                      </span>
                    </div>
                  )}
                  {booking.customer && booking.customer.email && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Un email de confirmation a été envoyé à <strong>{booking.customer.email}</strong>
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                    className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
                  >
                    Voir les détails de la réservation
                  </button>
                  <button
                    onClick={() => router.push('/catalogue')}
                    className="w-full px-6 py-2 bg-white text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                  >
                    Retour au catalogue
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <p className="text-gray-600 mb-4">Vous recevrez un email de confirmation avec les détails de votre réservation.</p>
                <button
                  onClick={() => router.push('/catalogue')}
                  className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  Retour au catalogue
                </button>
              </div>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Traitement en cours</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/catalogue')}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Retour au catalogue
            </button>
          </>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Référence de paiement: {paymentIntentId?.substring(0, 20)}...
        </p>
      </div>
    </div>
  );
}
