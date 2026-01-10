'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { DetailForm } from '@/components/DetailForm';
import { PaymentCard } from '@/components/PaymentCard';
import { PriceProvider } from '@/components/PriceProvider';

interface CatalogPageClientProps {
  catalogData: any;
}

// Skeleton pour le formulaire
const DetailFormSkeleton = () => (
  <div className="form-generator w-full max-w-none mx-auto px-0 sm:px-4 lg:px-8 py-2 sm:py-6">
    <div className="text-center mb-2 sm:mb-6">
      <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64 mx-auto mb-1 sm:mb-2 animate-pulse"></div>
      <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-96 mx-auto animate-pulse"></div>
    </div>
    <div className="card-ios p-2 sm:p-0">
      <div className="space-y-2 sm:space-y-5">
        <div className="space-y-2 sm:space-y-4">
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

export function CatalogPageClient({ catalogData }: CatalogPageClientProps) {
  const [submitHandler, setSubmitHandler] = useState<((insurance: boolean) => Promise<void>) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormReady = (handler: (insurance: boolean) => Promise<void>) => {
    setSubmitHandler(() => handler);
  };

  const handleSubmitFromPaymentCard = async (insuranceSelected: boolean) => {
    if (submitHandler) {
      setIsSubmitting(true);
      try {
        await submitHandler(insuranceSelected);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="w-full mt-6 sm:mt-8">
      <PriceProvider initialPrice={catalogData.item?.price || 0}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-8 px-0 sm:px-4 lg:px-0">
          {/* Colonne gauche (75%) - Formulaire de réservation */}
          <div className="lg:col-span-3 w-full">
            <Suspense fallback={<DetailFormSkeleton />}>
              <DetailForm catalogData={catalogData} onFormReady={handleFormReady} />
            </Suspense>
          </div>

          {/* Colonne droite (25%) - Détails du service et paiement */}
          <div className="lg:col-span-1 w-full space-y-6 mt-0 lg:mt-0">
            <Suspense fallback={<div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>}>
              <PaymentCard
                serviceType={catalogData.catalogSelection.category}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitFromPaymentCard}
                onSave={() => console.log('Sauvegardé')}
              />
            </Suspense>
          </div>
        </div>
      </PriceProvider>
    </div>
  );
}
