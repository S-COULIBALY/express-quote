'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotification } from '@/contexts/NotificationContext'
import { dateUtils } from '@/utils/dateUtils'
import { priceUtils } from '@/utils/priceUtils'
import type { CleaningQuote } from '@/types/quote'
import { PaymentProcessor } from '@/components/PaymentProcessor'
import { logger } from '@/lib/logger'

// Créer un logger sécurisé qui fonctionne même si withContext n'est pas disponible
const paymentLogger = logger.withContext ? 
  logger.withContext('CleaningPayment') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[CleaningPayment]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[CleaningPayment]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[CleaningPayment]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[CleaningPayment]', msg, ...args)
  };

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CleaningPaymentContent />
    </Suspense>
  )
}

function CleaningPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const { showNotification } = useNotification()
  const [quote, setQuote] = useState<CleaningQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState(0)

  useEffect(() => {
    if (quoteId) {
      setIsLoading(true);
      fetch(`/api/cleaning/${quoteId}`)
        .then(res => res.json())
        .then(data => {
          setQuote(data);
          
          // Calculer l'acompte (30%)
          const { total } = priceUtils.calculateTotal(data.estimatedPrice);
          const deposit = priceUtils.calculateDeposit(data.estimatedPrice);
          setDepositAmount(deposit);
          
          setIsLoading(false);
        })
        .catch(err => {
          paymentLogger.error('Erreur lors de la récupération du devis', err as Error);
          showNotification('error', 'Impossible de charger les détails du devis');
          setIsLoading(false);
        });
    }
  }, [quoteId, showNotification]);

  // Gestionnaire de succès pour le paiement
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      paymentLogger.info('Paiement réussi pour le service de nettoyage', { paymentIntentId });
      
      // Enregistrer le paiement côté serveur
      const response = await fetch('/api/cleaning/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          paymentIntentId
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement du paiement');
      }
      
      showNotification('success', 'Paiement traité avec succès');
      router.push(`/cleaning/success?id=${quoteId}`);
    } catch (error) {
      paymentLogger.error('Erreur lors de la finalisation du paiement', error as Error);
      showNotification('error', 'Erreur lors du traitement du paiement');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-medium text-lg mb-2">Devis non trouvé</h2>
          <p className="text-yellow-700">Nous n'avons pas pu trouver le devis demandé.</p>
          <button 
            onClick={() => router.push('/cleaning')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retour aux services de nettoyage
          </button>
        </div>
      </div>
    );
  }

  // Récapitulatif de la commande pour le paiement
  const OrderSummary = () => {
    const { total } = priceUtils.calculateTotal(quote.estimatedPrice);
    const deposit = priceUtils.calculateDeposit(quote.estimatedPrice);
    
    return (
      <div>
        <h3 className="font-medium text-gray-900 mb-2">Service de nettoyage</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Date de service</p>
          <p className="text-gray-700">{dateUtils.format(quote.preferredDate, 'long')}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Heure préférée</p>
          <p className="text-gray-700">{quote.preferredTime}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Type de nettoyage</p>
          <p className="text-gray-700">{quote.cleaningType}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Surface</p>
          <p className="text-gray-700">{quote.squareMeters} m²</p>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">Montant total</span>
            <span className="font-medium">{priceUtils.format(total)}</span>
          </div>
          
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">Acompte (30%)</span>
            <span>{priceUtils.format(deposit)}</span>
          </div>
          
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Solde restant</span>
            <span>{priceUtils.format(total - deposit)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Paiement du service de nettoyage</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2 order-2 md:order-1">
          <PaymentProcessor 
            paymentData={{
              id: quoteId || 'CLEANING-' + Date.now(),
              amount: depositAmount,
              description: `Acompte pour service de nettoyage (${quote.cleaningType || 'standard'})`,
              onSuccess: handlePaymentSuccess
            }}
            serviceName="Service de nettoyage"
            orderSummary={<OrderSummary />}
            backUrl="/cleaning"
          />
        </div>
        
        <div className="md:w-1/2 bg-gray-50 p-6 rounded-lg md:order-2">
          <h2 className="text-xl font-semibold mb-4">Informations importantes</h2>
          <div className="prose prose-sm">
            <p>Vous allez effectuer le paiement d'un acompte de 30% du montant total de votre service de nettoyage. Le solde sera réglé le jour du service.</p>
            <p className="mt-2">Une confirmation par email vous sera envoyée dès réception de votre paiement.</p>
            <p className="mt-2">Pour toute question concernant votre réservation, n'hésitez pas à nous contacter.</p>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Pour tester en mode développement</h3>
              <p className="text-blue-600">Utilisez la carte de test suivante :</p>
              <p className="font-mono text-sm mt-1">4242 4242 4242 4242</p>
              <p className="text-xs text-blue-500 mt-1">Date future quelconque, CVC: 3 chiffres quelconques</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 