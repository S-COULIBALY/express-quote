'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Page de redirection pour l'ancien flux payment
 * Redirige vers le nouveau flux unifié summary+payment
 */
export default function PaymentRedirect() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  useEffect(() => {
    if (!bookingId) {
      // Pas d'ID, retour au catalogue
      router.replace('/catalogue');
      return;
    }

    // Récupérer le temporaryId depuis l'API et rediriger vers /booking/[temporaryId]
    const fetchTemporaryId = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (response.ok) {
          const bookingData = await response.json();
          if (bookingData.success && bookingData.data.temporaryId) {
            router.replace(`/booking/${bookingData.data.temporaryId}`);
            return;
          }
        }
        // Fallback vers la page de succès si pas de temporaryId
        router.replace(`/success/${bookingId}`);
      } catch (error) {
        console.error('Erreur lors de la récupération du temporaryId:', error);
        // Fallback vers la page de succès en cas d'erreur
        router.replace(`/success/${bookingId}`);
      }
    };

    fetchTemporaryId();
  }, [bookingId, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-slate-800">Redirection en cours...</h2>
        <p className="mb-4 text-slate-600">
          Redirection vers le nouveau système de paiement intégré
        </p>
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}