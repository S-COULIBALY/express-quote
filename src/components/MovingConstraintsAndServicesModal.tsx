'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, PlusCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { UnifiedDataService, ServiceType } from '@/quotation/infrastructure/services/UnifiedDataService';
import { useModalPerformance, measureApiCall } from '@/lib/performance-metrics';
import { AutoDetectionService, AddressData } from '@/quotation/domain/services/AutoDetectionService';
import { ConstraintIconService, ConstraintTransformerService } from '@/quotation/domain/configuration';
import { allMovingItemsFallback } from '@/data/fallbacks';

/**
 * FLUX DE DONNÉES:
 * 1. Chargement: BDD via UnifiedDataService, fallbacks si erreur
 * 2. Auto-détection: Analyse étage/ascenseur → ajoute monte-meuble si requis
 * 3. Sélection: Validation des contraintes obligatoires (bloque désélection)
 * 4. Affichage: Raisons détaillées pour contraintes auto-ajoutées
 *
 * Fallbacks générés via: npm run generate:fallbacks
 */

export interface Constraint {
  id: string;
  name: string;
  category?: string;
  icon?: string;
  description?: string;
  type: 'constraint' | 'service';
  value?: number;
  impact?: string;
  autoDetection?: boolean;
  ruleId?: string;
  categoryLabel?: string;
}

// Exports pour compatibilité
export const constraintsFallback = allMovingItemsFallback.filter(item => item.type === 'constraint');
export const additionalServicesFallback = allMovingItemsFallback.filter(item => item.type === 'service');
export const allItemsFallback = allMovingItemsFallback;
export const constraints = allMovingItemsFallback;

function getIconForCategory(type: 'constraint' | 'service'): string {
  return ConstraintIconService.getIconForCategory('', type);
}

interface MovingConstraintsAndServicesModalProps {
  id?: 'pickup' | 'delivery';
  onChange?: (values: string[]) => void;
  buttonLabel?: string;
  modalTitle?: string;
  floor?: string;
  elevator?: string;
  formData?: any;
}

export default function MovingConstraintsAndServicesModal({ 
  id = 'pickup', 
  onChange = () => {}, 
  buttonLabel = "Contraintes & Services",
  modalTitle = "Contraintes d'accès et prestations supplémentaires",
  floor,
  elevator,
  formData
}: MovingConstraintsAndServicesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Constraint[]>([]);
  const [initialSelected, setInitialSelected] = useState<Constraint[]>([]);
  const [showFurnitureLiftWarning, setShowFurnitureLiftWarning] = useState(false);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [additionalServices, setAdditionalServices] = useState<Constraint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'database' | 'fallback'>('fallback');

  useModalPerformance('moving-constraints-modal');

  // Construction données adresse courante pour auto-détection
  const buildCurrentAddressData = (): AddressData => {
    const currentFloor = floor || (id === 'pickup' ? formData?.pickupFloor : formData?.deliveryFloor);
    const currentElevator = elevator || (id === 'pickup' ? formData?.pickupElevator : formData?.deliveryElevator);
    const currentCarryDistance = id === 'pickup' ? formData?.pickupCarryDistance : formData?.deliveryCarryDistance;

    return AutoDetectionService.buildAddressDataFromForm({
      floor: currentFloor,
      elevator: currentElevator,
      carryDistance: currentCarryDistance,
      selectedConstraints: selected.map(item => item.id)
    });
  };

  // Construction données autre adresse pour contexte complet
  const buildOtherAddressData = (): AddressData => {
    const otherFloor = id === 'pickup' ? formData?.deliveryFloor : formData?.pickupFloor;
    const otherElevator = id === 'pickup' ? formData?.deliveryElevator : formData?.pickupElevator;
    const otherCarryDistance = id === 'pickup' ? formData?.deliveryCarryDistance : formData?.pickupCarryDistance;

    return AutoDetectionService.buildAddressDataFromForm({
      floor: otherFloor,
      elevator: otherElevator,
      carryDistance: otherCarryDistance,
      selectedConstraints: []
    });
  };

  // Vérification monte-meuble requis
  const isFurnitureLiftRequired = (): boolean => {
    if (!formData) return false;

    try {
      const currentAddressData = buildCurrentAddressData();
      const result = AutoDetectionService.detectFurnitureLift(
        currentAddressData,
        formData.volume ? parseFloat(formData.volume) : undefined
      );

      return result.furnitureLiftRequired;
    } catch (error) {
      console.error(`❌ [MODAL-${id?.toUpperCase()}] Erreur détection monte-meuble:`, error);
      return false;
    }
  };

  // Vérification distance portage > 30m
  const shouldAddLongCarryingDistance = (): boolean => {
    if (!formData) return false;

    try {
      const currentAddressData = buildCurrentAddressData();
      const result = AutoDetectionService.detectLongCarryingDistance(currentAddressData);

      return result.longCarryingDistance;
    } catch (error) {
      console.error(`❌ [MODAL-${id?.toUpperCase()}] Erreur détection distance portage:`, error);
      return false;
    }
  };

  // Chargement des données: BDD en priorité, fallbacks si erreur
  useEffect(() => {
    async function initializeData() {
      setIsLoading(true);
      let apiData = null;

      try {
        const { result } = await measureApiCall(
          'moving-constraints-modal',
          async () => {
            const unifiedService = UnifiedDataService.getInstance();
            const allBusinessRules = await unifiedService.getBusinessRules(ServiceType.MOVING);

            if (!allBusinessRules || allBusinessRules.length === 0) {
              throw new Error('Aucune règle trouvée dans la BDD');
            }

            return ConstraintTransformerService.transformRulesToModalFormat(
              allBusinessRules,
              'MOVING'
            );
          },
          'api'
        );

        apiData = result;

      } catch (error) {
        console.warn('🔴 [MODAL] BDD indisponible, utilisation des fallbacks:', error);
        apiData = null;
      }

      if (apiData && apiData.meta.source === 'database' && apiData.constraints.length > 0) {
        setConstraints(apiData.constraints);
        setAdditionalServices(apiData.services);
        setDataSource('database');
      } else {
        setConstraints(constraintsFallback);
        setAdditionalServices(additionalServicesFallback);
        setDataSource('fallback');
      }

      setIsLoading(false);
    }

    initializeData();
  }, []); // Chargement une seule fois au montage

  // Gérer automatiquement le monte-meuble selon les conditions - ✅ INDÉPENDANT PAR ADRESSE
  useEffect(() => {
    const furnitureLiftConstraint = constraints.find(c => c.id === 'furniture_lift_required');
    const longCarryingConstraint = constraints.find(c => c.id === 'long_carrying_distance');
    
    const isCurrentlyFurnitureLiftSelected = selected.some(s => s.id === 'furniture_lift_required');
    const isCurrentlyLongCarryingSelected = selected.some(s => s.id === 'long_carrying_distance');
    
    let newSelected = [...selected];
    let hasChanges = false;
    
    // Gestion monte-meuble
    if (isFurnitureLiftRequired()) {
      if (furnitureLiftConstraint && !isCurrentlyFurnitureLiftSelected) {
        newSelected.push(furnitureLiftConstraint);
        hasChanges = true;
      }
    } else {
      if (isCurrentlyFurnitureLiftSelected) {
        newSelected = newSelected.filter(s => s.id !== 'furniture_lift_required');
        hasChanges = true;
        setShowFurnitureLiftWarning(false);
      }
    }

    // Gestion distance de portage
    if (shouldAddLongCarryingDistance()) {
      if (longCarryingConstraint && !isCurrentlyLongCarryingSelected) {
        newSelected.push(longCarryingConstraint);
        hasChanges = true;
      }
    } else {
      if (isCurrentlyLongCarryingSelected) {
        newSelected = newSelected.filter(s => s.id !== 'long_carrying_distance');
        hasChanges = true;
      }
    }
    
    // Appliquer les changements seulement s'il y en a
    if (hasChanges) {
      setSelected(newSelected);
      onChange(newSelected.map(item => item.id));
    }
  }, [
    floor,
    elevator,
    id === 'pickup' ? formData?.pickupFloor : formData?.deliveryFloor,
    id === 'pickup' ? formData?.pickupElevator : formData?.deliveryElevator,
    id === 'pickup' ? formData?.pickupCarryDistance : formData?.deliveryCarryDistance,
    formData?.volume,
    selected,
    constraints,
    onChange,
    id
  ]);

  function openModal() {
    setInitialSelected(selected);
    setIsOpen(true);
  }

  // Validation de la sélection (bloque désélection contraintes obligatoires)
  function handleSelectionChange(selectedItems: Constraint[]) {
    const addressData = buildCurrentAddressData();
    const volume = formData?.volume ? parseFloat(formData.volume) : undefined;

    const validation = AutoDetectionService.validateConstraintSelection(
      selected.map(s => s.id),
      selectedItems.map(s => s.id),
      addressData,
      volume
    );

    if (!validation.isValid) {
      if (validation.blockedConstraintId === 'furniture_lift_required') {
        setShowFurnitureLiftWarning(true);
      }
      return;
    }

    setSelected(selectedItems);
    onChange(selectedItems.map(item => item.id));
    setShowFurnitureLiftWarning(false);
  }

  const selectedConstraints = selected.filter(item => item.type === 'constraint');
  const selectedServices = selected.filter(item => item.type === 'service');

  // Affichage du bouton selon l'état
  let buttonContent: React.ReactNode;

  if (isLoading) {
    buttonContent = (
      <div className="flex items-center gap-2 text-blue-500">
        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span>Chargement...</span>
      </div>
    );
  } else {
    
    const sourceIndicator = dataSource === 'database' ? '🗄️' : '⚠️';
    const sourceTitle = dataSource === 'database'
      ? 'Données depuis la base de données'
      : 'Données de fallback (API indisponible)';

    buttonContent = (
      <div className="flex items-center gap-2 text-gray-500">
        <PlusCircleIcon className="w-4 h-4" />
        <span>{buttonLabel}</span>
        <span className="text-xs" title={sourceTitle}>{sourceIndicator}</span>
      </div>
    );
  }
  
  if (selected.length > 0) {
    const constraintCount = selectedConstraints.length;
    const serviceCount = selectedServices.length;
    
    buttonContent = (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{selected.length}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-700 font-medium">
          {constraintCount > 0 && (
            <span className="text-xs">
              {constraintCount} contrainte{constraintCount > 1 ? 's' : ''}
            </span>
          )}
          {constraintCount > 0 && serviceCount > 0 && (
            <span className="text-gray-400">•</span>
          )}
          {serviceCount > 0 && (
            <span className="text-xs">
              {serviceCount} service{serviceCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Handler pour Annuler
  function handleCancel() {
    setSelected(initialSelected);
    setIsOpen(false);
  }

  // Handler pour OK
  function handleOk() {
    setInitialSelected(selected);
    setIsOpen(false);
  }

  return (
    <React.Fragment>
      {/* Bouton moderne épuré avec style des autres inputs */}
      <button
        type="button"
        onClick={openModal}
        className="relative w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg 
                   text-sm text-left shadow-sm
                   hover:border-emerald-400 hover:bg-emerald-50/30
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                   transition-all duration-200 
                   flex items-center justify-between"
      >
        <div className="flex-1 min-w-0">
          {buttonContent}
        </div>
        
        {/* Icône de chevron plus discrète */}
        <ChevronUpDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {/* Affichage discret du nombre d'éléments sélectionnés */}
      {selected.length > 0 && (
        <div className="mt-1 px-1">
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {selectedConstraints.length > 0 && `${selectedConstraints.length} contrainte${selectedConstraints.length > 1 ? 's' : ''}`}
            {selectedConstraints.length > 0 && selectedServices.length > 0 && ' • '}
            {selectedServices.length > 0 && `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100] modal-mobile" onClose={handleCancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-full sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-full sm:scale-95"
              >
                <Dialog.Panel className="modal-content w-full max-w-6xl transform overflow-hidden
                                       rounded-t-3xl sm:rounded-2xl bg-white p-0 text-left align-middle shadow-xl
                                       transition-all border-0 sm:border border-emerald-200
                                       max-h-[90vh] sm:max-h-[85vh]">
                  <Dialog.Title
                    as="div"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 mobile-px-4 mobile-py-3 sticky top-0 z-10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 truncate">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{modalTitle}</span>
                      </h3>
                      {/* Handle de fermeture mobile */}
                      <button
                        onClick={handleCancel}
                        className="sm:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Fermer"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Handle visuel pour swipe to dismiss sur mobile */}
                    <div className="sm:hidden flex justify-center mt-2">
                      <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                    </div>
                  </Dialog.Title>

                  <div className="mobile-px-4 mobile-py-3 overflow-y-auto flex-1">
                    {/* Message d'information automatique pour le monte-meuble */}
                    {(() => {
                      const isRequired = isFurnitureLiftRequired();
                      const isSelected = selected.some(s => s.id === 'furniture_lift_required');

                      if (isRequired && isSelected) {
                        const addressData = buildCurrentAddressData();
                        const volume = formData?.volume ? parseFloat(formData.volume) : 0;
                        const reasons = AutoDetectionService.getDetailedReasonsForFurnitureLift(
                          addressData,
                          volume
                        );

                        const reasonsText = reasons.length > 0 ? reasons.join(', ') : 'contraintes détectées';
                        
                        return (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-blue-800">Monte-meuble automatiquement ajouté</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  En raison de : {reasonsText}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}

                    {/* Message d'avertissement si tentative de décocher */}
                    {showFurnitureLiftWarning && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Monte-meuble obligatoire</p>
                            <p className="text-xs text-amber-600 mt-1">
                              Le monte-meuble est nécessaire en raison des contraintes sélectionnées ou des conditions du déménagement (étage élevé, volume important, meubles encombrants, etc.). Cette contrainte ne peut pas être supprimée.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowFurnitureLiftWarning(false)}
                              className="mt-2 text-xs text-amber-700 hover:text-amber-800 underline"
                            >
                              J'ai compris
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Layout en deux colonnes - Mobile first */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4">
                      {/* Colonne 1: Contraintes logistiques */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.994-1.286 2.994-2.857L19 8.143C19 6.286 17.546 5 16.006 5H7.994C6.454 5 5 6.286 5 8.143L3.008 16.143C3.008 17.714 4.454 19 5.994 19z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Contraintes d'accès</h4>
                            <p className="text-xs text-gray-500">Difficultés logistiques à signaler</p>
                          </div>
                        </div>
                        <MultipleSelect
                          items={constraints}
                          selected={selected}
                          onChange={handleSelectionChange}
                          placeholder="Sélectionner les contraintes"
                          furnitureLiftRequired={isFurnitureLiftRequired()}
                          longCarryingDistanceRequired={shouldAddLongCarryingDistance()}
                          type="constraints"
                        />
                      </div>

                      {/* Colonne 2: Prestations supplémentaires */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Prestations supplémentaires</h4>
                            <p className="text-xs text-gray-500">Services optionnels disponibles</p>
                          </div>
                        </div>
                        <MultipleSelect
                          items={additionalServices}
                          selected={selected}
                          onChange={handleSelectionChange}
                          placeholder="Sélectionner les services"
                          furnitureLiftRequired={false}
                          type="services"
                        />
                      </div>
                    </div>

                    </div>

                    {/* Boutons mobile-first */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 mobile-px-4 mobile-py-3 mt-auto">
                      <div className="flex flex-col sm:flex-row justify-end mobile-gap-3 sm:gap-3">
                        <button
                          type="button"
                          className="touch-48 inline-flex justify-center rounded-lg border border-gray-300 bg-white
                                   mobile-px-4 mobile-py-3 text-sm sm:text-base font-medium text-gray-700
                                   hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                                   focus-visible:ring-offset-2 transition-colors order-2 sm:order-1"
                          onClick={handleCancel}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          className="touch-48 inline-flex justify-center rounded-lg border border-transparent
                                   bg-emerald-600 mobile-px-4 mobile-py-3 text-sm sm:text-base font-medium text-white
                                   hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                                   focus-visible:ring-offset-2 transition-colors order-1 sm:order-2"
                          onClick={handleOk}
                        >
                          Valider la sélection
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </React.Fragment>
  );
}

interface MultipleSelectProps {
  items: Constraint[];
  selected: Constraint[];
  onChange: (selectedItems: Constraint[]) => void;
  placeholder?: string;
  furnitureLiftRequired?: boolean;
  longCarryingDistanceRequired?: boolean;
  type: 'constraints' | 'services';
}

function MultipleSelect({ 
  items, 
  selected, 
  onChange, 
  placeholder, 
  furnitureLiftRequired = false, 
  longCarryingDistanceRequired = false,
  type 
}: MultipleSelectProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = searchQuery === ''
    ? items
    : items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Grouper les éléments par catégorie
  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, Constraint[]>);

  // Labels pour contraintes
  const constraintCategoryLabels = {
    vehicle: '🚛 Accès véhicule',
    building: '🏢 Contraintes bâtiment',
    distance: '📏 Distance et portage',
    security: '🛡️ Sécurité et autorisations',
    other: '📋 Autres contraintes'
  };

  // Labels pour services
  const serviceCategoryLabels = {
    handling: '🔧 Services de manutention',
    packing: '📦 Services d\'emballage',
    protection: '🛡️ Services de protection',
    annexe: '🏪 Services annexes',
    other: '🔧 Autres services'
  };

  const categoryLabels = type === 'constraints' ? constraintCategoryLabels : serviceCategoryLabels;

  const toggleSelection = (item: Constraint) => {
    const isSelected = selected.some(i => i.id === item.id);
    
    if (isSelected) {
      // Désélectionner l'élément
      onChange(selected.filter(i => i.id !== item.id));
    } else {
      // Sélectionner l'élément
      onChange([...selected, item]);
    }
  };

  return (
    <div className="relative w-full">
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-150">
        {/* Selected items */}
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {selected.filter(item => items.some(i => i.id === item.id)).map((item) => {
            const isFurnitureLiftAutoAdded = item.id === 'furniture_lift_required' && furnitureLiftRequired;
            const isLongCarryingAutoAdded = item.id === 'long_carrying_distance' && longCarryingDistanceRequired;
            const isAutoAdded = isFurnitureLiftAutoAdded || isLongCarryingAutoAdded;
            
            return (
              <span 
                key={item.id} 
                className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${
                  isAutoAdded 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : type === 'constraints'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-emerald-100 text-emerald-800'
                }`}
                title={item.description}
              >
                <span className="mr-1 text-xs">{item.icon || ConstraintIconService.getIconForRule(item.name, 'MOVING', item.type || 'constraint')}</span>
                {isAutoAdded && (
                  <svg className="w-3 h-3 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {item.name}
                {isAutoAdded && <span className="ml-1 text-xs">(auto)</span>}
                {!isAutoAdded && (
                  <button 
                    type="button" 
                    onClick={() => toggleSelection(item)} 
                    className={`ml-1 transition-colors ${
                      type === 'constraints' 
                        ? 'text-orange-600 hover:text-orange-800' 
                        : 'text-emerald-600 hover:text-emerald-800'
                    }`}
                  >
                    <span className="sr-only">Supprimer</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </span>
            );
          })}
        </div>
        {/* Search input avec icône */}
        <div className="px-4 pb-2 pt-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${type === 'constraints' ? 'text-orange-500' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full border-0 focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400 text-sm bg-white"
            placeholder={selected.filter(item => items.some(i => i.id === item.id)).length > 0 ? "Rechercher..." : placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Séparateur visuel plus moderne */}
        <div className={`border-b mx-4 ${type === 'constraints' ? 'border-orange-200' : 'border-emerald-200'}`} />
        {/* Dropdown groupé par catégories */}
        <div className="max-h-[320px] overflow-auto pb-2">
          {Object.entries(groupedItems).length > 0 ? (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                {/* En-tête de catégorie */}
                <div className={`px-4 py-2 border-b border-gray-100 ${type === 'constraints' ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </h4>
                </div>
                {/* Items de la catégorie */}
                {categoryItems.map((item) => {
                  const isSelected = selected.some(i => i.id === item.id);
                  const isFurnitureLiftAutoAdded = item.id === 'furniture_lift_required' && furnitureLiftRequired;
                  const isLongCarryingAutoAdded = item.id === 'long_carrying_distance' && longCarryingDistanceRequired;
                  const isAutoAdded = isFurnitureLiftAutoAdded || isLongCarryingAutoAdded;
                  
                  if (searchQuery !== '' && isSelected) return null;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 py-2.5 px-4 transition-colors ${
                        isAutoAdded 
                          ? 'cursor-not-allowed bg-blue-50 text-blue-900' 
                          : isSelected 
                            ? type === 'constraints'
                              ? 'cursor-pointer text-orange-900 bg-orange-50 hover:bg-orange-100'
                              : 'cursor-pointer text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                            : 'cursor-pointer text-gray-900 hover:bg-gray-50'
                      }`}
                      title={item.description}
                    >
                      {/* Checkbox visuelle */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isAutoAdded && toggleSelection(item)}
                        disabled={isAutoAdded}
                        className={`h-4 w-4 rounded border transition-all duration-200 ${
                          isAutoAdded
                            ? 'border-blue-300 text-blue-600 bg-blue-100 cursor-not-allowed'
                            : isSelected
                              ? type === 'constraints'
                                ? 'border-orange-500 text-orange-600 focus:ring-orange-500/20'
                                : 'border-emerald-500 text-emerald-600 focus:ring-emerald-500/20'
                              : 'border-gray-300 text-gray-600 hover:border-gray-400 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon || ConstraintIconService.getIconForRule(item.name, 'MOVING', item.type || 'constraint')}</span>
                          <span className="font-medium text-sm">{item.name}</span>
                          {isAutoAdded && (
                            <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                              auto
                        </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
              Aucun résultat.
            </div>
          )}
        </div>
      </div>
      {/* Texte d'aide simplifié */}
      <div className={`text-xs mt-2 px-1 flex items-center gap-1 ${type === 'constraints' ? 'text-orange-600' : 'text-emerald-600'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${type === 'constraints' ? 'text-orange-500' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {type === 'constraints' 
          ? 'Cochez toutes les contraintes qui s\'appliquent' 
          : 'Sélectionnez les services supplémentaires souhaités'
        }
      </div>
    </div>
  );
} 