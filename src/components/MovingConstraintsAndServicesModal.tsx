'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, PlusCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FLOOR_CONSTANTS } from '@/quotation/domain/configuration/constants';

// Type pour les contraintes et services
export interface Constraint {
  id: string;
  name: string;
  category?: string;
  icon?: string;
  description?: string;
  type: 'constraint' | 'service';
}

// Options de contraintes logistiques
export const constraints: Constraint[] = [
  // 🚛 Accès véhicule
  { id: 'pedestrian_zone', name: 'Zone piétonne avec restrictions', category: 'vehicle', icon: '🚛', description: 'Autorisation mairie requise', type: 'constraint' },
  { id: 'narrow_inaccessible_street', name: 'Rue étroite ou inaccessible au camion', category: 'vehicle', icon: '🚛', description: 'Camion ne peut pas accéder', type: 'constraint' },
  { id: 'difficult_parking', name: 'Stationnement difficile ou payant', category: 'vehicle', icon: '🚛', description: 'Surcoût possible', type: 'constraint' },
  { id: 'complex_traffic', name: 'Sens unique ou circulation complexe', category: 'vehicle', icon: '🚛', description: 'Temps de trajet augmenté', type: 'constraint' },
  
  // 🏢 Contraintes bâtiment
  { id: 'elevator_unavailable', name: 'Ascenseur en panne ou hors service', category: 'building', icon: '🏢', description: 'Ascenseur non fonctionnel', type: 'constraint' },
  { id: 'elevator_unsuitable_size', name: 'Ascenseur trop petit pour les meubles', category: 'building', icon: '🏢', description: 'Dimensions insuffisantes', type: 'constraint' },
  { id: 'elevator_forbidden_moving', name: 'Ascenseur interdit pour déménagement', category: 'building', icon: '🏢', description: 'Règlement copropriété', type: 'constraint' },
  { id: 'difficult_stairs', name: 'Escalier étroit, en colimaçon ou dangereux', category: 'building', icon: '🏢', description: 'Monte-meuble recommandé', type: 'constraint' },
  { id: 'narrow_corridors', name: 'Couloirs étroits ou encombrés (< 1m de large)', category: 'building', icon: '🏢', description: 'Temps augmenté', type: 'constraint' },
  
  // 📏 Distance et portage
  { id: 'long_carrying_distance', name: 'Distance immeuble-camion supérieure à 30m', category: 'distance', icon: '📏', description: 'Surcoût main d\'œuvre', type: 'constraint' },
  { id: 'indirect_exit', name: 'Passage par cour, jardin ou sous-sol obligatoire', category: 'distance', icon: '📏', description: 'Sortie non directe sur rue', type: 'constraint' },
  { id: 'complex_multilevel_access', name: 'Accès complexe multi-niveaux', category: 'distance', icon: '📏', description: 'Plusieurs étages à traverser', type: 'constraint' },
  
  // 🛡️ Sécurité et autorisations
  { id: 'access_control', name: 'Contrôle d\'accès strict (gardien/interphone)', category: 'security', icon: '🛡️', description: 'Autorisation préalable requise', type: 'constraint' },
  { id: 'administrative_permit', name: 'Autorisation administrative obligatoire', category: 'security', icon: '🛡️', description: 'Démarches préalables', type: 'constraint' },
  { id: 'time_restrictions', name: 'Restrictions horaires strictes', category: 'security', icon: '🛡️', description: 'Créneaux limités', type: 'constraint' },
  { id: 'fragile_floor', name: 'Sol fragile ou délicat (parquet ancien, marbre)', category: 'security', icon: '🛡️', description: 'Protection supplémentaire', type: 'constraint' },
  
  // Contrainte spéciale (gérée automatiquement)
  { id: 'furniture_lift_required', name: 'Monte-meuble', category: 'building', icon: '🏢', description: 'Ajouté automatiquement si nécessaire', type: 'constraint' }
];

// Prestations supplémentaires
export const additionalServices: Constraint[] = [
  // 🔧 Services de manutention
  { id: 'bulky_furniture', name: 'Meubles encombrants ou non démontables', category: 'handling', icon: '🔧', description: 'Armoires, canapés d\'angle, etc.', type: 'service' },
  { id: 'furniture_disassembly', name: 'Démontage de meubles au départ', category: 'handling', icon: '🔧', description: 'Temps supplémentaire inclus', type: 'service' },
  { id: 'furniture_reassembly', name: 'Remontage de meubles à l\'arrivée', category: 'handling', icon: '🔧', description: 'Temps supplémentaire inclus', type: 'service' },
  
  // 📦 Services d'emballage
  { id: 'professional_packing_departure', name: 'Emballage professionnel au départ', category: 'packing', icon: '📦', description: 'Équipe spécialisée avec matériel', type: 'service' },
  { id: 'professional_unpacking_arrival', name: 'Déballage professionnel à l\'arrivée', category: 'packing', icon: '📦', description: 'Équipe spécialisée avec nettoyage', type: 'service' },
  { id: 'packing_supplies', name: 'Fournitures d\'emballage complètes', category: 'packing', icon: '📦', description: 'Cartons, papier bulle, sangles', type: 'service' },
  
  // 🛡️ Services de protection
  { id: 'fragile_valuable_items', name: 'Objets fragiles ou de grande valeur', category: 'protection', icon: '🛡️', description: 'Emballage renforcé + assurance', type: 'service' },
  { id: 'heavy_items', name: 'Objets très lourds (piano, coffre-fort, etc.)', category: 'protection', icon: '🛡️', description: 'Équipement spécialisé requis', type: 'service' },
  { id: 'additional_insurance', name: 'Assurance complémentaire renforcée', category: 'protection', icon: '🛡️', description: 'Calcul sur valeur déclarée', type: 'service' },
  
  // 🏪 Services annexes
  { id: 'temporary_storage_service', name: 'Stockage temporaire sécurisé', category: 'annexe', icon: '🏪', description: 'Garde-meuble avec accès', type: 'service' }
];

// Combine constraints and services
export const allItems = [...constraints, ...additionalServices];

interface MovingConstraintsAndServicesModalProps {
  id?: 'pickup' | 'delivery';
  onChange?: (values: string[]) => void;
  buttonLabel?: string;
  modalTitle?: string;
  // Pour la logique automatique du monte-meuble
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showFurnitureLiftWarning, setShowFurnitureLiftWarning] = useState(false);
  
  // Logique pour détecter si le monte-meuble est nécessaire
  const isFurnitureLiftRequired = () => {
    const currentFloor = floor || (id === 'pickup' ? formData?.pickupFloor : formData?.deliveryFloor);
    const currentElevator = elevator || (id === 'pickup' ? formData?.pickupElevator : formData?.deliveryElevator);
    const volume = formData?.volume ? parseFloat(formData.volume) : 0;
    
    console.log(`🏗️ Détection monte-meuble [${id}]:`, {
      currentFloor,
      currentElevator,
      volume,
      formData: {
        pickupFloor: formData?.pickupFloor,
        deliveryFloor: formData?.deliveryFloor,
        pickupElevator: formData?.pickupElevator,
        deliveryElevator: formData?.deliveryElevator
      }
    });
    
    // Récupérer les contraintes et services sélectionnés
    const selectedIds = selected.map(item => item.id);
    
    // Variables pour la nouvelle logique
    const floorNumber = currentFloor ? parseInt(currentFloor) : 0;
    const ascenseur_present = currentElevator && currentElevator !== 'no';
    const ascenseur_type = currentElevator || 'no';
    
    // Contraintes d'ascenseur
    const ascenseur_indisponible = selectedIds.includes('elevator_unavailable');
    const ascenseur_inadapte = selectedIds.includes('elevator_unsuitable_size');
    const ascenseur_interdit_demenagement = selectedIds.includes('elevator_forbidden_moving');
    
    // Contraintes d'accès
    const escalier_difficile = selectedIds.includes('difficult_stairs');
    const couloirs_etroits = selectedIds.includes('narrow_corridors');
    const sortie_indirecte = selectedIds.includes('indirect_exit');
    const cour_a_traverser = selectedIds.includes('indirect_exit'); // Même contrainte
    
    // Services/objets
    const meubles_encombrants = selectedIds.includes('bulky_furniture');
    const objet_tres_lourd = selectedIds.includes('fragile_valuable_items') || selectedIds.includes('heavy_items');
    
    // 🎯 NOUVELLE LOGIQUE ÉCONOMIQUE
    
    // CAS 1: Ascenseur medium/large fonctionnel → PAS de monte-meuble
    if (ascenseur_present && ['medium', 'large'].includes(ascenseur_type) &&
        !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement) {
      console.log(`🏗️ Monte-meuble [${id}] → NON REQUIS (ascenseur ${ascenseur_type} fonctionnel)`);
      return false;
    }
    
    // CAS 2: Ascenseur small avec contraintes spécifiques
    if (ascenseur_present && ascenseur_type === 'small' &&
        !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement &&
        (escalier_difficile || couloirs_etroits || sortie_indirecte || cour_a_traverser) &&
        floorNumber >= 1 &&
        (meubles_encombrants || objet_tres_lourd)) {
      return true;
    }
    
    // CAS 3: Aucun ascenseur - LOGIQUE HARMONISÉE
    if (!ascenseur_present) {
             // Cas 3a: Étage > 3 → Monte-meuble OBLIGATOIRE (même sans contraintes)
       if (floorNumber > 3) {
         console.log(`🏗️ Monte-meuble [${id}] → REQUIS (étage ${floorNumber} > 3, aucun ascenseur)`);
         return true;
       }
      
      // Cas 3b: Étage >= 1 avec contraintes spécifiques OU objets lourds/encombrants
      if (floorNumber >= 1 && 
          ((escalier_difficile || couloirs_etroits || sortie_indirecte || cour_a_traverser) ||
           (meubles_encombrants || objet_tres_lourd))) {
        return true;
      }
    }
    
    // CAS 4: Ascenseur indisponible/inadapté/interdit → Traiter comme "aucun ascenseur"
    if (ascenseur_indisponible || ascenseur_inadapte || ascenseur_interdit_demenagement) {
      // Cas 4a: Étage > 3 → Monte-meuble OBLIGATOIRE (même sans contraintes)
      if (floorNumber > 3) {
        return true;
      }
      
      // Cas 4b: Étage >= 1 avec contraintes spécifiques OU objets lourds/encombrants
      if (floorNumber >= 1 && 
          ((escalier_difficile || couloirs_etroits || sortie_indirecte || cour_a_traverser) ||
           (meubles_encombrants || objet_tres_lourd))) {
        return true;
      }
    }
    
    // Par défaut : pas de monte-meuble
    console.log(`🏗️ Monte-meuble [${id}] → NON REQUIS (aucune condition remplie)`);
    return false;
  };

  // Gérer automatiquement le monte-meuble selon les conditions - ✅ INDÉPENDANT PAR ADRESSE
  useEffect(() => {
    const furnitureLiftConstraint = constraints.find(c => c.id === 'furniture_lift_required');
    const isCurrentlySelected = selected.some(s => s.id === 'furniture_lift_required');
    
    if (isFurnitureLiftRequired()) {
      // Ajouter le monte-meuble s'il n'est pas déjà sélectionné
      if (furnitureLiftConstraint && !isCurrentlySelected) {
        const newSelected = [...selected, furnitureLiftConstraint];
        setSelected(newSelected);
        onChange(newSelected.map(item => item.id));
      }
    } else {
      // Retirer le monte-meuble s'il était automatiquement ajouté et n'est plus nécessaire
      if (isCurrentlySelected) {
        const newSelected = selected.filter(s => s.id !== 'furniture_lift_required');
        setSelected(newSelected);
        onChange(newSelected.map(item => item.id));
        setShowFurnitureLiftWarning(false); // Réinitialiser l'avertissement
      }
    }
  }, [
    // ✅ CORRECTION: Surveiller uniquement les données de l'adresse concernée
    floor, 
    elevator, 
    // Surveiller uniquement les données de l'adresse spécifique (pickup OU delivery)
    id === 'pickup' ? formData?.pickupFloor : formData?.deliveryFloor,
    id === 'pickup' ? formData?.pickupElevator : formData?.deliveryElevator,
    formData?.volume, // Volume global OK
    selected
  ]);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setInitialSelected(selected);
    setIsOpen(true);
  }

  function handleSelectionChange(selectedItems: Constraint[]) {
    // Vérifier si l'utilisateur essaie manuellement de décocher le monte-meuble quand c'est nécessaire
    const wasFurnitureLiftSelected = selected.some(s => s.id === 'furniture_lift_required');
    const isFurnitureLiftSelected = selectedItems.some(s => s.id === 'furniture_lift_required');
    
    if (wasFurnitureLiftSelected && !isFurnitureLiftSelected && isFurnitureLiftRequired()) {
      // L'utilisateur essaie manuellement de décocher le monte-meuble alors qu'il est nécessaire
      setShowFurnitureLiftWarning(true);
      return; // Ne pas appliquer le changement
    }
    
    setSelected(selectedItems);
    onChange(selectedItems.map(item => item.id));
    setShowFurnitureLiftWarning(false);
  }

  // Séparer les contraintes et services sélectionnés
  const selectedConstraints = selected.filter(item => item.type === 'constraint');
  const selectedServices = selected.filter(item => item.type === 'service');

  // Résumé pour le bouton avec style moderne
  let buttonContent = (
    <div className="flex items-center gap-2 text-gray-500">
      <PlusCircleIcon className="w-4 h-4" />
      <span>{buttonLabel}</span>
    </div>
  );
  
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
    <>
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
                <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-xl transition-all border border-emerald-200">
                  <Dialog.Title
                    as="div"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4"
                  >
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {modalTitle}
                    </h3>
                  </Dialog.Title>
                  
                  <div className="p-6">
                    {/* Message d'information automatique pour le monte-meuble */}
                    {(() => {
                      const isRequired = isFurnitureLiftRequired();
                      const isSelected = selected.some(s => s.id === 'furniture_lift_required');
                      const currentFloor = id === 'pickup' ? formData?.pickupFloor : formData?.deliveryFloor;
                      const currentElevator = id === 'pickup' ? formData?.pickupElevator : formData?.deliveryElevator;
                      const volume = formData?.volume ? parseFloat(formData.volume) : 0;
                      
                      if (isRequired && isSelected) {
                        // Déterminer les raisons du monte-meuble
                        const selectedIds = selected.map(item => item.id);
                        const reasons = [];
                        
                        if (selectedIds.includes('elevator_unavailable')) reasons.push('ascenseur indisponible');
                        if (selectedIds.includes('difficult_stairs')) reasons.push('escalier difficile');
                        if (selectedIds.includes('narrow_corridors')) reasons.push('couloirs étroits');
                        if (selectedIds.includes('indirect_exit')) reasons.push('sortie indirecte');
                        if (selectedIds.includes('bulky_furniture')) reasons.push('meubles encombrants');
                        if (selectedIds.includes('fragile_valuable_items')) reasons.push('objets fragiles/précieux');
                        if (selectedIds.includes('heavy_items')) reasons.push('objets très lourds');
                        
                        const floorNumber = currentFloor ? parseInt(currentFloor) : 0;
                        const hasNoElevator = !currentElevator || currentElevator === 'no';
                        const hasSmallElevator = currentElevator === 'small';
                        if (floorNumber > FLOOR_CONSTANTS.FURNITURE_LIFT_REQUIRED_THRESHOLD && (hasNoElevator || hasSmallElevator)) {
                          reasons.push(`étage élevé (${currentFloor})`);
                        }
                        
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
                                  {volume >= FLOOR_CONSTANTS.SMALL_VOLUME_EXCEPTION && (volume > 0) && (
                                    <span className="block mt-1">Volume : {volume} m³ (≥ {FLOOR_CONSTANTS.SMALL_VOLUME_EXCEPTION} m³)</span>
                                  )}
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
                    
                    {/* Layout en deux colonnes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
                        onClick={handleCancel}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
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
    </>
  );
}

interface MultipleSelectProps {
  items: Constraint[];
  selected: Constraint[];
  onChange: (selectedItems: Constraint[]) => void;
  placeholder?: string;
  furnitureLiftRequired?: boolean;
  type: 'constraints' | 'services';
}

function MultipleSelect({ items, selected, onChange, placeholder, furnitureLiftRequired = false, type }: MultipleSelectProps) {
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
            const isAutoAdded = item.id === 'furniture_lift_required' && furnitureLiftRequired;
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
                {item.icon && <span className="mr-1 text-xs">{item.icon}</span>}
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
                  const isAutoAdded = item.id === 'furniture_lift_required' && furnitureLiftRequired;
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
                            : type === 'constraints'
                              ? 'border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500'
                              : 'border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                        }`}
                      />
                      {/* Icône de la contrainte/service */}
                      {item.icon && (
                        <span className="text-sm flex-shrink-0">{item.icon}</span>
                      )}
                      {/* Label de l'option */}
                      <div className="flex-1 min-w-0">
                        <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
                          {item.name}
                          {isAutoAdded && <span className="ml-2 text-xs text-blue-600">(obligatoire)</span>}
                        </span>
                        {item.description && (
                          <span className="block text-xs text-gray-500 truncate mt-0.5">
                            {item.description}
                          </span>
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