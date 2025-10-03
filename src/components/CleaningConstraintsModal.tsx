'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { UnifiedDataService, ServiceType } from '@/quotation/infrastructure/services/UnifiedDataService';
import { useModalPerformance, measureApiCall } from '@/lib/performance-metrics';
import { ConstraintIconService, ConstraintTransformerService } from '@/quotation/domain/configuration';
import { allCleaningItemsFallback } from '@/data/fallbacks';

/**
 * FLUX DE DONNÉES:
 * 1. Au montage: Tentative de chargement depuis BDD via UnifiedDataService
 * 2. Si succès: Utilise les données fraîches de la BDD (source: 'database')
 * 3. Si échec: Utilise les fallbacks générés (source: 'fallback')
 *
 * Les fallbacks sont générés via: npm run generate:fallbacks
 * Source: Table Rule en BDD, avec icônes pré-assignées
 */

interface CleaningConstraint {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  type?: 'constraint' | 'service';
  value?: number;
  impact?: string;
  autoDetection?: boolean;
  ruleId?: string;
  categoryLabel?: string;
}

// Export pour compatibilité avec code existant
export { allCleaningItemsFallback };
export const cleaningConstraints = allCleaningItemsFallback;

interface CleaningConstraintsModalProps {
  onChange?: (values: string[]) => void;
  buttonLabel?: string;
  modalTitle?: string;
  selectedConstraints?: string[];
  showSelectedCount?: boolean;
}

export default function CleaningConstraintsModal({ 
  onChange = () => {}, 
  buttonLabel = "Contraintes spécifiques",
  modalTitle = "Contraintes spécifiques au service",
  selectedConstraints = [],
  showSelectedCount = false
}: CleaningConstraintsModalProps) {
  const [cleaningConstraints, setCleaningConstraints] = useState<CleaningConstraint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'database' | 'fallback'>('fallback');

  useModalPerformance('cleaning-constraints-modal');

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<CleaningConstraint[]>([]);
  const [tempSelected, setTempSelected] = useState<CleaningConstraint[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Chargement des données: BDD en priorité, fallbacks si erreur
  useEffect(() => {
    async function initializeCleaningData() {
      setIsLoading(true);

      let apiData = null;

      try {
        const { result } = await measureApiCall(
          'cleaning-constraints-modal',
          async () => {
            const unifiedService = UnifiedDataService.getInstance();
            const allBusinessRules = await unifiedService.getBusinessRules(ServiceType.CLEANING);

            if (!allBusinessRules || allBusinessRules.length === 0) {
              throw new Error('Aucune règle trouvée dans la BDD');
            }

            // Transformation via ConstraintTransformerService
            return ConstraintTransformerService.transformRulesToModalFormat(
              allBusinessRules,
              'CLEANING'
            );
          },
          'api'
        );

        apiData = result;

      } catch (error) {
        console.warn('🔴 [MODAL] BDD indisponible, utilisation des fallbacks:', error);
        apiData = null;
      }

      // Utiliser données BDD ou fallbacks
      if (apiData && apiData.meta.source === 'database' && apiData.allItems.length > 0) {
        setCleaningConstraints(apiData.allItems);
        setDataSource('database');
      } else {
        setCleaningConstraints(allCleaningItemsFallback);
        setDataSource('fallback');
      }

      setIsLoading(false);
    }

    initializeCleaningData();
  }, []);

  // Synchroniser la sélection avec les props
  useEffect(() => {
    if (cleaningConstraints.length > 0) {
      const initialSelected = cleaningConstraints.filter(constraint =>
        selectedConstraints.includes(constraint.id)
      );
      setSelected(initialSelected);
      setTempSelected(initialSelected);
    }
  }, [cleaningConstraints, selectedConstraints]);

  function openModal() {
    setTempSelected(selected);
    setIsOpen(true);
  }

  function handleSelectionChange(selectedItems: typeof cleaningConstraints) {
    setTempSelected(selectedItems);
  }

  function handleCancel() {
    setIsOpen(false);
  }

  function handleOk() {
    setSelected(tempSelected);
    onChange(tempSelected.map(item => item.id));
    setIsOpen(false);
  }

  // Affichage du bouton selon l'état
  let buttonSummary;

  if (isLoading) {
    buttonSummary = (
      <div className="flex items-center gap-2 text-blue-500 text-xs">
        <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span>Chargement...</span>
      </div>
    );
  } else if (selected.length === 1) {
    buttonSummary = (
      <span 
        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-[200px] relative"
        onMouseEnter={() => setHoveredItem(selected[0].id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <span className="truncate">{selected[0].name}</span>
        {hoveredItem === selected[0].id && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              {selected[0].name}
            </div>
            <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
          </div>
        )}
      </span>
    );
  } else if (selected.length > 1) {
    buttonSummary = (
      <div className="flex items-center gap-1 overflow-hidden">
        {selected.slice(0, 3).map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#e6f5f0] text-[#067857] truncate max-w-[120px] relative"
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span className="truncate">{item.name}</span>
            {hoveredItem === item.id && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {item.name}
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>
            )}
          </span>
        ))}
        {selected.length > 3 && (
          <span
            className="text-xs text-[#067857] relative cursor-help"
            onMouseEnter={() => setHoveredItem('more')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            +{selected.length - 3}
            {hoveredItem === 'more' && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 pointer-events-none min-w-[150px]">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1">
                  {selected.slice(3).map(item => item.name).join(', ')}
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>
            )}
          </span>
        )}
      </div>
    );
  } else {
    // Aucune sélection, afficher label avec indicateur de source
    const sourceIndicator = dataSource === 'database' ? '🗄️' : '⚠️';
    const sourceTitle = dataSource === 'database'
      ? 'Données depuis la BDD'
      : 'Données de fallback';

    buttonSummary = (
      <div className="flex items-center gap-1 text-gray-400 text-xs">
        <span>{buttonLabel}</span>
        <span title={sourceTitle}>{sourceIndicator}</span>
      </div>
    );
  }

  return (
    <>
      {/* Bouton pour ouvrir le modal */}
      <button
        type="button"
        onClick={openModal}
        className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white hover:border-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px]"
      >
        <PlusCircleIcon className="h-4 w-4 mr-1.5 text-gray-500" />
        {buttonSummary}
      </button>

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
                                       max-h-[90vh] sm:max-h-[85vh] flex flex-col">
                  <Dialog.Title
                    as="div"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 mobile-px-4 mobile-py-3 sticky top-0 z-10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 truncate">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4">
                        {/* Contraintes */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.994-1.286 2.994-2.857L19 8.143C19 6.286 17.546 5 16.006 5H7.994C6.454 5 5 6.286 5 8.143L3.008 16.143C3.008 17.714 4.454 19 5.994 19z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Contraintes spécifiques</h4>
                              <p className="text-xs text-gray-500">Difficultés particulières à signaler</p>
                            </div>
                          </div>
                          <CleaningMultipleSelect
                            items={cleaningConstraints.filter(item => item.type === 'constraint')}
                            selected={tempSelected}
                            onChange={handleSelectionChange}
                            placeholder="Sélectionner les contraintes"
                            type="constraints"
                          />
                        </div>

                        {/* Services supplémentaires */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Services supplémentaires</h4>
                              <p className="text-xs text-gray-500">Options additionnelles disponibles</p>
                            </div>
                          </div>
                          <CleaningMultipleSelect
                            items={cleaningConstraints.filter(item => item.type === 'service')}
                            selected={tempSelected}
                            onChange={handleSelectionChange}
                            placeholder="Sélectionner les services"
                            type="services"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
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
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Compteur optionnel */}
      {showSelectedCount && selected.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="px-2 py-1.5 bg-[#e6f5f0] rounded-lg border border-[#067857]/20">
            <p className="text-[#067857] font-medium">
              {selected.length} contrainte(s) sélectionnée(s)
            </p>
          </div>
        </div>
      )}
    </>
  );
}

interface CleaningMultipleSelectProps {
  items: CleaningConstraint[];
  selected: CleaningConstraint[];
  onChange: (selectedItems: CleaningConstraint[]) => void;
  placeholder?: string;
  type: 'constraints' | 'services';
}

function CleaningMultipleSelect({
  items,
  selected,
  onChange,
  placeholder,
  type
}: CleaningMultipleSelectProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = searchQuery === ''
    ? items
    : items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Grouper par catégorie
  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, CleaningConstraint[]>);

  const constraintCategoryLabels = {
    access: '🏢 Contraintes d\'accès',
    work: '👥 Contraintes de travail',
    schedule: '⏰ Contraintes horaires',
    location: '🏠 Contraintes du lieu',
    utilities: '⚡ Contraintes matérielles',
    other: '🧽 Autres contraintes'
  };

  const serviceCategoryLabels = {
    specialized: '🧽 Services spécialisés',
    disinfection: '🦠 Services de désinfection',
    maintenance: '🪑 Services d\'entretien',
    logistics: '🚚 Services logistiques',
    other: '🔧 Autres services'
  };

  const categoryLabels = type === 'constraints' ? constraintCategoryLabels : serviceCategoryLabels;

  const toggleSelection = (item: CleaningConstraint) => {
    const isSelected = selected.some(i => i.id === item.id);
    onChange(isSelected ? selected.filter(i => i.id !== item.id) : [...selected, item]);
  };

  return (
    <div className="relative w-full">
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-150">
        {/* Items sélectionnés */}
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {selected.filter(item => items.some(i => i.id === item.id)).map((item) => (
            <span
              key={item.id}
              className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${
                type === 'constraints'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
              title={item.description}
            >
              <span className="mr-1 text-xs">{item.icon || ConstraintIconService.getIconForRule(item.name, 'CLEANING', item.type || 'constraint')}</span>
              {item.name}
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
            </span>
          ))}
        </div>
        {/* Recherche */}
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
        <div className={`border-b mx-4 ${type === 'constraints' ? 'border-orange-200' : 'border-emerald-200'}`} />
        {/* Liste groupée par catégorie */}
        <div className="max-h-[320px] overflow-auto pb-2">
          {Object.entries(groupedItems).length > 0 ? (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <div className={`px-4 py-2 border-b border-gray-100 ${type === 'constraints' ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </h4>
                </div>
                {categoryItems.map((item) => {
                  const isSelected = selected.some(i => i.id === item.id);

                  if (searchQuery !== '' && isSelected) return null;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 py-2.5 px-4 transition-colors ${
                        isSelected
                          ? type === 'constraints'
                            ? 'cursor-pointer text-orange-900 bg-orange-50 hover:bg-orange-100'
                            : 'cursor-pointer text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                          : 'cursor-pointer text-gray-900 hover:bg-gray-50'
                      }`}
                      title={item.description}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item)}
                        className={`h-4 w-4 rounded border transition-all duration-200 ${
                          isSelected
                            ? type === 'constraints'
                              ? 'border-orange-500 text-orange-600 focus:ring-orange-500/20'
                              : 'border-emerald-500 text-emerald-600 focus:ring-emerald-500/20'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.icon || ConstraintIconService.getIconForRule(item.name, 'CLEANING', item.type || 'constraint')}</span>
                          <span className="font-medium text-sm">{item.name}</span>
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
      {/* Aide */}
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