'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'

// Créer un logger sécurisé qui fonctionne même si withContext n'est pas disponible
const successLogger = logger.withContext ? 
  logger.withContext('CleaningSuccess') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[CleaningSuccess]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[CleaningSuccess]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[CleaningSuccess]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[CleaningSuccess]', msg, ...args)
  };

interface CleaningQuote {
  id: string
  propertyType: string
  cleaningType: string
  preferredDate: string
  preferredTime: string
  status: string
  estimatedPrice: number
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const paymentIntentId = searchParams.get('payment_intent')
  const [quoteData, setQuoteData] = useState<CleaningQuote | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Vérifier le paiement si un ID d'intention de paiement est fourni
        if (paymentIntentId) {
          successLogger.info(`Vérification du paiement avec ID: ${paymentIntentId}`);
          
          try {
            const statusResponse = await fetch(`/api/payment/verify/${paymentIntentId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!statusResponse.ok) {
              successLogger.warn('Vérification du paiement échouée');
            } else {
              const paymentData = await statusResponse.json();
              setPaymentStatus(paymentData.status);
              successLogger.info(`Statut du paiement: ${paymentData.status}`);
            }
          } catch (error) {
            successLogger.error('Erreur lors de la vérification du paiement', error as Error);
          }
        }
        
        // Récupérer les détails du devis
        if (quoteId) {
          successLogger.info(`Récupération du devis avec ID: ${quoteId}`);
          const response = await fetch(`/api/cleaning/${quoteId}`);
          
          if (!response.ok) {
            throw new Error(`Erreur lors de la récupération du devis: ${response.status}`);
          }
          
          const data = await response.json();
          setQuoteData(data);
          successLogger.info('Devis récupéré avec succès');
        }
      } catch (err) {
        successLogger.error('Erreur lors de la récupération des données', err as Error);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [quoteId, paymentIntentId])

  if (loading) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-36 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 text-red-500">
            <h1 className="text-2xl font-bold mb-2">Erreur</h1>
            <p>{error}</p>
          </div>
          <Link href="/cleaning" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Retour aux services de nettoyage
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h1 className="text-3xl font-bold mb-4">Réservation confirmée !</h1>
          <p className="text-gray-600">
            Merci d'avoir choisi notre service de nettoyage.
          </p>
          
          {paymentStatus && (
            <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm ${
              paymentStatus === 'succeeded' ? 'bg-green-100 text-green-800' : 
              paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              <span className="mr-1">{
                paymentStatus === 'succeeded' ? '✓ Paiement confirmé' : 
                paymentStatus === 'processing' ? '⋯ Paiement en cours' : 
                'Paiement en attente'
              }</span>
            </div>
          )}
        </div>

        {quoteData && (
          <div className="bg-white shadow rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4">Détails du service</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-gray-500">Type de service</dt>
                <dd className="font-medium">{quoteData.cleaningType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Type de propriété</dt>
                <dd className="font-medium">{quoteData.propertyType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="font-medium">{quoteData.preferredDate}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Heure</dt>
                <dd className="font-medium">{quoteData.preferredTime}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Prix estimé</dt>
                <dd className="font-medium">{quoteData.estimatedPrice} €</dd>
              </div>
              <div>
                <dt className="text-gray-500">Statut</dt>
                <dd className="font-medium">{quoteData.status}</dd>
              </div>
              {paymentIntentId && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Référence de paiement</dt>
                  <dd className="font-medium">{paymentIntentId.substring(0, 8)}...</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Prochaines étapes</h2>
          <ul className="text-left space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Un email de confirmation a été envoyé à votre adresse email
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Les détails de votre devis et votre reçu sont joints en PDF
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Notre équipe vous contactera prochainement pour confirmer les détails
            </li>
          </ul>
        </div>

        <div className="space-x-4">
          <Link
            href="/cleaning"
            className="inline-block px-6 py-2 border rounded hover:bg-gray-100"
          >
            Voir tous les devis
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  )
} 