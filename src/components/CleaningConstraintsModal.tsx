'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

// Options de contraintes spécifiques aux services de nettoyage
export const cleaningConstraints = [
  // Contraintes d'accès
  { id: 'limited_parking', name: 'Stationnement limité' },
  { id: 'no_elevator', name: 'Absence d\'ascenseur' },
  { id: 'difficult_access', name: 'Accès difficile au bâtiment' },
  { id: 'security_check', name: 'Contrôle de sécurité' },
  { id: 'intercom_required', name: 'Interphone obligatoire' },
  
  // Contraintes de travail
  { id: 'pets_present', name: 'Présence d\'animaux' },
  { id: 'children_present', name: 'Présence d\'enfants' },
  { id: 'allergies', name: 'Allergies à signaler' },
  { id: 'fragile_items', name: 'Objets fragiles/précieux' },
  { id: 'heavy_furniture', name: 'Meubles lourds à déplacer' },
  
  // Contraintes horaires
  { id: 'specific_time_window', name: 'Créneau horaire spécifique' },
  { id: 'early_morning', name: 'Intervention matinale requise' },
  { id: 'evening_service', name: 'Service en soirée uniquement' },
  { id: 'weekend_only', name: 'Uniquement le weekend' },
  
  // Contraintes liées au lieu
  { id: 'very_dirty', name: 'Saleté importante/tenace' },
  { id: 'post_construction', name: 'Post-construction/travaux' },
  { id: 'water_damage', name: 'Dégâts des eaux' },
  { id: 'mold_presence', name: 'Présence de moisissure' },
  { id: 'limited_space', name: 'Espace de travail restreint' },
  
  // Contraintes matérielles
  { id: 'no_water_supply', name: 'Pas d\'accès à l\'eau' },
  { id: 'no_power_supply', name: 'Pas d\'accès à l\'électricité' },
  { id: 'special_products_required', name: 'Produits spécifiques nécessaires' },
  { id: 'special_equipment_needed', name: 'Équipement spécial requis' }
];

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
  const initialSelected = cleaningConstraints.filter(constraint => 
    selectedConstraints.includes(constraint.id)
  );
  
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<typeof cleaningConstraints>(initialSelected);
  const [tempSelected, setTempSelected] = useState<typeof cleaningConstraints>(initialSelected);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  function closeModal() {
    setIsOpen(false);
  }

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
  
  const toggleSelection = (item: { id: string; name: string }) => {
    const isSelected = tempSelected.some(i => i.id === item.id);
    
    if (isSelected) {
      // Désélectionner l'élément
      handleSelectionChange(tempSelected.filter(i => i.id !== item.id));
    } else {
      // Sélectionner l'élément
      handleSelectionChange([...tempSelected, item]);
    }
  };
  
  const filteredItems = searchQuery === ''
    ? cleaningConstraints
    : cleaningConstraints.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Résumé pour le bouton
  let buttonSummary = (
    <span className="text-gray-400 text-xs">{buttonLabel}</span>
  );
  if (selected.length === 1) {
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
        <Dialog as="div" className="relative z-[100]" onClose={handleCancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-0 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="div"
                    className="bg-[#067857] px-6 py-4"
                  >
                    <h3 className="text-lg font-medium text-white">
                      {modalTitle}
                    </h3>
                  </Dialog.Title>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="relative w-full">
                        <div className="bg-white border-2 border-[#067857] rounded-xl shadow focus-within:border-[#067857] focus-within:ring-2 focus-within:ring-[#067857]/20 transition-all duration-150">
                          {/* Selected items */}
                          <div className="flex flex-wrap gap-2 px-4 pt-4">
                            {tempSelected.map((item) => (
                              <span 
                                key={item.id} 
                                className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-[#e6f5f0] text-[#067857]"
                              >
                                {item.name}
                                <button 
                                  type="button" 
                                  onClick={() => toggleSelection(item)} 
                                  className="ml-1 text-[#067857] hover:text-[#034e37]"
                                >
                                  <span className="sr-only">Supprimer</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </span>
                            ))}
                          </div>
                          {/* Search input avec icône */}
                          <div className="px-4 pb-2 pt-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#067857]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 108 0 4 4 0 00-8 0zm5-4V8m0 0V4m0 4H9m3 0h3" />
                            </svg>
                            <input
                              type="text"
                              className="w-full border-0 focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400 text-sm bg-white"
                              placeholder={tempSelected.length > 0 ? "Rechercher d'autres contraintes..." : "Sélectionner les contraintes spécifiques à ce service"}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                          {/* Séparateur visuel */}
                          <div className="border-b-2 border-[#067857] mx-4" />
                          {/* Dropdown toujours visible */}
                          <div className="max-h-[320px] overflow-auto pb-2">
                            {filteredItems.length > 0 ? (
                              filteredItems.map((item) => {
                                const isSelected = tempSelected.some(i => i.id === item.id);
                                if (searchQuery !== '' && isSelected) return null;
                                return (
                                  <div
                                    key={item.id}
                                    className={`cursor-pointer select-none relative py-2.5 pl-10 pr-4 hover:bg-[#e6f5f0] ${
                                      isSelected ? 'text-[#067857] font-medium' : 'text-gray-900'
                                    }`}
                                    onMouseDown={() => toggleSelection(item)}
                                  >
                                    <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
                                      {item.name}
                                    </span>
                                    {isSelected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#067857]">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
                                Aucun résultat trouvé.
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Texte d'aide sous la zone */}
                        <div className="text-xs text-[#067857] mt-1 px-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#067857]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0" />
                          </svg>
                          Vous pouvez sélectionner <b>plusieurs contraintes</b>.
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#067857] focus-visible:ring-offset-2"
                        onClick={handleCancel}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-[#067857] px-4 py-2 text-sm font-medium text-white hover:bg-[#034e37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#067857] focus-visible:ring-offset-2"
                        onClick={handleOk}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Affichage des contraintes sélectionnées - seulement si showSelectedCount est true */}
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