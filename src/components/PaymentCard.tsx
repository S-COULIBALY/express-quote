'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CurrencyEuroIcon,
  CheckCircleIcon,
  TruckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { usePrice } from './PriceProvider';

interface PaymentCardProps {
  serviceType: string;
  isSubmitting?: boolean;
  onSubmit?: (insuranceSelected: boolean) => void;
  onSave?: () => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  serviceType,
  isSubmitting = false,
  onSubmit,
  onSave
}) => {
  const { calculatedPrice: totalPrice, basePrice } = usePrice();
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'deposit'>('deposit');
  const [insuranceSelected, setInsuranceSelected] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'moving':
      case 'demenagement':
        return <TruckIcon className="h-5 w-5 text-emerald-600" />;
      case 'cleaning':
      case 'menage':
        return <SparklesIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const insuranceAmount = 25; // Assurance de 25€
  const finalPrice = insuranceSelected ? totalPrice + insuranceAmount : totalPrice;
  const depositAmount = Math.round(finalPrice * 0.3); // 30% d'acompte
  const remainingAmount = finalPrice - depositAmount;

  return (
    <div className="sticky top-8 space-y-6">
      {/* Prix et options de paiement */}
      <Card className="card-ios">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CurrencyEuroIcon className="h-5 w-5 text-emerald-600" />
            Réservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prix total */}
          <div className="text-center py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {formatPrice(finalPrice)}
            </div>
            <div className="text-sm text-gray-600">Prix total TTC</div>
            {insuranceSelected && (
              <div className="text-xs text-gray-500 mt-1">
                (Service : {formatPrice(totalPrice)} + Assurance : {formatPrice(insuranceAmount)})
              </div>
            )}
          </div>

          {/* Assurance */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Options supplémentaires</div>
            
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={insuranceSelected}
                onChange={(e) => setInsuranceSelected(e.target.checked)}
                className="text-emerald-600 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <span>🛡️</span>
                  Assurance Protection Plus
                </div>
                <div className="text-sm text-gray-600">
                  Protection complète + {formatPrice(insuranceAmount)}
                </div>
              </div>
            </label>
          </div>

          {/* Mode de paiement */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Mode de paiement</div>
            
            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="font-medium text-gray-900">
                Acompte (30%)
              </div>
              <div className="text-sm text-gray-600">
                {formatPrice(depositAmount)} maintenant, {formatPrice(remainingAmount)} le jour J
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <Button
              onClick={() => onSubmit?.(insuranceSelected)}
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Réservation en cours...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {getServiceIcon(serviceType)}
                  <span>Réserver maintenant</span>
                </div>
              )}
            </Button>

            <Button
              onClick={onSave}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-xl"
            >
              Sauvegarder pour plus tard
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
