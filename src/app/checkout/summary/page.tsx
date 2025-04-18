'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pack, Service } from '@/types/booking'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckBadgeIcon, 
  DocumentTextIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { 
  calculateExtraDurationCost, 
  calculateExtraWorkersCost, 
  calculateExtraDistanceCost, 
  calculateLiftCost,
  calculateTotalWithOptions
} from '@/actions/priceCalculator'
import {
  getCurrentBooking,
  updateInsuranceOption
} from '@/actions/bookingManager'
import {
  getPackById,
  getServiceById
} from '@/actions/dataProvider'
import {
  getInsuranceConstants
} from '@/actions/pricingConstants'

export default function CheckoutSummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [booking, setBooking] = useState<any>(null)
  const [itemDetails, setItemDetails] = useState<Pack | Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null)
  const [hasInsurance, setHasInsurance] = useState(false)
  const [insuranceConstants, setInsuranceConstants] = useState({
    INSURANCE_PRICE_HT: 12.5,
    INSURANCE_PRICE_TTC: 15
  })
  
  // State variables for total calculations
  const [totalPriceHT, setTotalPriceHT] = useState(0)
  const [totalPriceTTC, setTotalPriceTTC] = useState(0)
  
  // État pour stocker les calculs asynchrones
  const [extraCosts, setExtraCosts] = useState({
    durationCost: 0,
    workersCost: 0,
    distanceCost: 0
  });
  
  // Charger les constantes d'assurance
  useEffect(() => {
    const loadConstants = async () => {
      try {
        const constants = await getInsuranceConstants();
        setInsuranceConstants(constants);
      } catch (error) {
        console.error('Erreur lors du chargement des constantes:', error);
      }
    };
    
    loadConstants();
  }, []);
  
  // Récupérer les données de réservation au chargement
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        // Récupérer la réservation courante du serveur
        const currentBooking = await getCurrentBooking();
        
        if (!currentBooking || currentBooking.items.length === 0) {
          console.error('Aucune réservation trouvée');
          router.push('/');
          return;
        }
        
        setBooking(currentBooking);
        setHasInsurance(currentBooking.hasInsurance);
        
        // Récupérer les détails du premier élément
        const firstItem = currentBooking.items[0];
        if (firstItem.type === 'pack') {
          const pack = await getPackById(firstItem.itemId);
          setItemDetails(pack || null);
        } else if (firstItem.type === 'service') {
          const service = await getServiceById(firstItem.itemId);
          setItemDetails(service || null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBookingData();
  }, [router]);
  
  // Mettre à jour les données lorsque l'assurance change
  useEffect(() => {
    const updateBookingInsurance = async () => {
      if (booking && booking.hasInsurance !== hasInsurance) {
        setSaveStatus('saving');
        try {
          // Appeler la Server Action pour mettre à jour l'option d'assurance
          const updatedBooking = await updateInsuranceOption(hasInsurance);
          setBooking(updatedBooking);
          setSaveStatus('saved');
          
          // Réinitialiser le statut après quelques secondes
          setTimeout(() => {
            setSaveStatus(null);
          }, 2000);
        } catch (error) {
          console.error('Erreur lors de la mise à jour de l\'assurance:', error);
          setSaveStatus('error');
        }
      }
    };
    
    updateBookingInsurance();
  }, [hasInsurance, booking]);
  
  // Calculer les coûts extras une seule fois au chargement ou quand les données changent
  useEffect(() => {
    const calculateExtraCosts = async () => {
      if (!booking || !itemDetails || booking.items.length === 0) return;
      
      try {
        const bookingItem = booking.items[0].data;
        const isPack = booking.items[0].type === 'pack';
        
        // Calcul du coût des jours/heures supplémentaires
        const durationCost = await calculateExtraDurationCost(
          isPack,
          bookingItem.duration,
          isPack ? 1 : itemDetails.duration,
          itemDetails.price,
          bookingItem.workers
        );
        
        // Calcul du coût des travailleurs supplémentaires
        const workersCost = await calculateExtraWorkersCost(
          isPack,
          bookingItem.workers,
          isPack ? 2 : 1,
          bookingItem.duration
        );
        
        // Calcul du coût de la distance supplémentaire (pour les packs)
        let distanceCost = 0;
        if (isPack && bookingItem.distance) {
          distanceCost = await calculateExtraDistanceCost(bookingItem.distance);
        }
        
        setExtraCosts({
          durationCost,
          workersCost,
          distanceCost
        });

        // Calculate total price
        const baseTotal = itemDetails.price + durationCost + workersCost + distanceCost + (booking.liftCost || 0);
        const insuranceCost = hasInsurance ? insuranceConstants.INSURANCE_PRICE_HT : 0;
        const totalHT = baseTotal + insuranceCost;
        const totalTTC = totalHT * 1.2;

        setTotalPriceHT(totalHT);
        setTotalPriceTTC(totalTTC);
      } catch (error) {
        console.error('Erreur lors du calcul des coûts supplémentaires:', error);
      }
    };
    
    calculateExtraCosts();
  }, [booking, itemDetails, hasInsurance, insuranceConstants.INSURANCE_PRICE_HT]);
  
  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasInsurance(e.target.checked);
  };
  
  const handleContinue = () => {
    router.push('/checkout/payment');
  };
  
  const handleEditBooking = () => {
    if (!booking || booking.items.length === 0) return;
    
    const item = booking.items[0];
    if (item.type === 'pack') {
      router.push(`/packs/${item.itemId}`);
    } else if (item.type === 'service') {
      router.push(`/services/${item.itemId}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-center text-gray-600">Chargement en cours...</div>
        </div>
      </div>
    );
  }
  
  if (!booking || !itemDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-md mx-auto text-center bg-white rounded-xl shadow-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Aucune réservation trouvée</h2>
          <p className="mb-6 text-gray-600">Vous n'avez pas de réservation en cours.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  // Partie restante du rendu
  const firstItem = booking.items[0];
  const bookingDetails = firstItem.data;
  const isPack = firstItem.type === 'pack';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Link href={isPack ? `/packs/${firstItem.itemId}` : `/services/${firstItem.itemId}`} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Retour</span>
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Récapitulatif de votre commande</h1>
          
          {saveStatus === 'saving' && (
            <div className="text-gray-500 text-sm flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="mr-2">Enregistrement</span>
              <div className="animate-spin h-4 w-4 border-2 border-t-emerald-500 border-emerald-200 rounded-full"></div>
            </div>
          )}
          
          {saveStatus === 'saved' && (
            <div className="text-emerald-700 text-sm flex items-center bg-emerald-50 px-3 py-1 rounded-full">
              <CheckBadgeIcon className="h-4 w-4 mr-1" />
              <span>Modifications enregistrées</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="text-red-700 text-sm flex items-center bg-red-50 px-3 py-1 rounded-full">
              <span>Erreur</span>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Votre service ou pack */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">1</div>
                <h2 className="text-base font-medium text-gray-900">Votre {isPack ? 'pack' : 'service'}</h2>
                <button
                  onClick={handleEditBooking}
                  className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  <span>Modifier</span>
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row mb-4">
                <div className="sm:w-32 md:w-48 flex-shrink-0 mb-4 sm:mb-0">
                  {/* Check if image exists on the itemDetails object */}
                  {(itemDetails as any).image ? (
                    <img
                      src={(itemDetails as any).image}
                      alt={itemDetails.name}
                      className="w-full h-auto rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/2] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      <TruckIcon className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="sm:ml-6 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{itemDetails.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{itemDetails.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                      <span>
                        {bookingDetails.workers} professionnel{bookingDetails.workers > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                      <span>
                        {bookingDetails.duration} {isPack ? 'jour' : 'heure'}{bookingDetails.duration > 1 ? 's' : ''}
                      </span>
                    </div>
                    {bookingDetails.date && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                        <span>
                          {format(new Date(bookingDetails.date), 'd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {isPack && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Adresses :</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-1.5 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Adresse de départ :</div>
                        <div className="text-sm text-gray-600">{bookingDetails.pickupAddress}</div>
                        {bookingDetails.pickupFloor && (
                          <div className="text-xs text-gray-500 mt-1">
                            Étage : {bookingDetails.pickupFloor} 
                            {bookingDetails.pickupHasElevator ? ' (avec ascenseur)' : ' (sans ascenseur)'}
                            {bookingDetails.pickupNeedsLift && ' - Monte-meuble nécessaire'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-1.5 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Adresse d'arrivée :</div>
                        <div className="text-sm text-gray-600">{bookingDetails.deliveryAddress}</div>
                        {bookingDetails.deliveryFloor && (
                          <div className="text-xs text-gray-500 mt-1">
                            Étage : {bookingDetails.deliveryFloor} 
                            {bookingDetails.deliveryHasElevator ? ' (avec ascenseur)' : ' (sans ascenseur)'}
                            {bookingDetails.deliveryNeedsLift && ' - Monte-meuble nécessaire'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {bookingDetails.additionalInfo && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Informations supplémentaires :</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{bookingDetails.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Options supplémentaires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">2</div>
                <h2 className="text-base font-medium text-gray-900">Options supplémentaires</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    id="insurance"
                    name="insurance"
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={handleInsuranceChange}
                    className="h-4 w-4 mt-1 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <label htmlFor="insurance" className="text-sm font-medium text-gray-900">
                      Assurance complémentaire
                    </label>
                    <p className="text-sm text-gray-500">
                      Protection étendue contre les dommages accidentels pendant le transport et la manutention.
                      <span className="block text-emerald-600 font-medium mt-0.5">
                        +{insuranceConstants.INSURANCE_PRICE_HT}€ HT ({insuranceConstants.INSURANCE_PRICE_TTC}€ TTC)
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex pt-3 pb-2">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p>Notre assurance de base couvre vos biens jusqu'à 50 000€. Nos professionnels sont tous assurés pour les dommages éventuels.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Récapitulatif des coûts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-sky-50">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">3</div>
                <h2 className="text-base font-medium text-gray-900">Récapitulatif des coûts</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-medium text-gray-900">Prix total</span>
                    <span className="block text-sm text-gray-500">TVA incluse</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-emerald-700">{totalPriceTTC.toFixed(2)}€ TTC</span>
                    <span className="block text-sm text-gray-600">soit {totalPriceHT}€ HT</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{itemDetails.name}</span>
                  <span className="text-sm font-medium">{itemDetails.price}€</span>
                </div>
                
                {extraCosts.workersCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Professionnels supplémentaires</span>
                    <span className="font-medium">+{extraCosts.workersCost}€</span>
                  </div>
                )}
                
                {extraCosts.durationCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{isPack ? 'Jours' : 'Heures'} supplémentaires</span>
                    <span className="font-medium">+{extraCosts.durationCost}€</span>
                  </div>
                )}
                
                {extraCosts.distanceCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance supplémentaire</span>
                    <span className="font-medium">+{extraCosts.distanceCost}€</span>
                  </div>
                )}
                
                {booking.liftCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Monte-meuble
                      {(bookingDetails.pickupNeedsLift && bookingDetails.deliveryNeedsLift) ? ' (départ et arrivée)' : 
                      bookingDetails.pickupNeedsLift ? ' (départ)' : ' (arrivée)'}
                    </span>
                    <span className="font-medium">+{booking.liftCost}€</span>
                  </div>
                )}

                {hasInsurance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assurance complémentaire</span>
                    <span className="font-medium">+{insuranceConstants.INSURANCE_PRICE_HT}€</span>
                  </div>
                )}
                
                <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-900">Sous-total HT</span>
                  <span className="font-medium">{totalPriceHT}€</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA (20%)</span>
                  <span className="text-gray-600">{(totalPriceHT * 0.2).toFixed(2)}€</span>
                </div>
                
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-900">Total TTC</span>
                  <span className="font-bold text-emerald-600">{totalPriceTTC.toFixed(2)}€</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mt-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Ce qui est inclus :</h3>
                <ul className="space-y-1.5">
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">
                      {isPack ? 
                        `Pack complet avec ${bookingDetails.workers} professionnel${bookingDetails.workers > 1 ? 's' : ''}` :
                        `Service avec ${bookingDetails.workers} professionnel${bookingDetails.workers > 1 ? 's' : ''}`}
                    </span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">
                      {isPack ? 
                        `${bookingDetails.duration} jour${bookingDetails.duration > 1 ? 's' : ''} de prestation` :
                        `${bookingDetails.duration} heure${bookingDetails.duration > 1 ? 's' : ''} de prestation`}
                    </span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">Professionnels qualifiés et assurés</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">Service client 7j/7</span>
                  </li>
                  {hasInsurance && (
                    <li className="flex items-start text-sm">
                      <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-blue-700">Assurance complémentaire</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Détails du devis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">4</div>
                <h2 className="text-base font-medium text-gray-900">Détails du devis</h2>
              </div>
            </div>
            <div className="p-5">
              {/* Référence et dates du devis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-5 border-b border-gray-200">
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Référence devis</h3>
                  <p className="text-sm font-medium">DEV-{new Date().getFullYear()}-{booking.id.substring(0, 6)}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Dates</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-600">Date d'émission :</span>{' '}
                      <span className="font-medium">{format(new Date(), 'dd/MM/yyyy', { locale: fr })}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Validité :</span>{' '}
                      <span className="font-medium">30 jours</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Détails de la prestation */}
              <div className="mb-6 pb-5 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Détails de la prestation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type de prestation</span>
                    <span className="font-medium">{isPack ? 'Pack déménagement' : 'Service à la demande'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tarif de base</span>
                    <span className="font-medium">{itemDetails.price}€ HT</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nombre de professionnels</span>
                    <span className="font-medium">{bookingDetails.workers} personnes</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Durée prévue</span>
                    <span className="font-medium">{bookingDetails.duration} {isPack ? 'jour(s)' : 'heure(s)'}</span>
                  </div>
                  
                  {isPack && bookingDetails.distance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Distance totale</span>
                      <span className="font-medium">{bookingDetails.distance} km</span>
                    </div>
                  )}
                  
                  {bookingDetails.vehicleType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type de véhicule</span>
                      <span className="font-medium">{bookingDetails.vehicleType}</span>
                    </div>
                  )}
                  
                  {booking.liftCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monte-meuble</span>
                      <span className="font-medium">Inclus</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date de prestation</span>
                    <span className="font-medium">{bookingDetails.date ? format(new Date(bookingDetails.date), 'dd MMMM yyyy', { locale: fr }) : 'À convenir'}</span>
                  </div>
                </div>
              </div>

              {/* Détails additionnels */}
              <div className="mb-6 pb-5 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Détails des services</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {itemDetails.includes.map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <CheckBadgeIcon className="h-4 w-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions de règlement */}
              <div className="mb-6 pb-5 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Conditions de règlement</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">• Acompte de 30% à la commande</p>
                  <p className="text-sm text-gray-600">• Solde à régler le jour de la prestation</p>
                  <p className="text-sm text-gray-600">• Moyens de paiement acceptés : carte bancaire, virement, chèque</p>
                </div>
              </div>

              {/* Note légale */}
              <div className="text-xs text-gray-500 mb-2">
                <p>Ce devis est établi conformément à nos conditions générales de vente. Les prix indiqués sont garantis pendant 30 jours à compter de la date d'émission.</p>
              </div>
            </div>
          </div>
          
          {/* Boutons de navigation */}
          <div className="flex items-center justify-between mt-6">
            <Link
              href={isPack ? `/packs/${firstItem.itemId}` : `/services/${firstItem.itemId}`}
              className="px-5 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg"
            >
              Retour
            </Link>
            
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Continuer vers le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 