"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedRuleManagerDisplay } from "./UnifiedRuleManagerDisplay";
import { useUnifiedRules } from "@/hooks/useUnifiedRules";
import { ServiceType } from "@/quotation/domain/enums/ServiceType";
import { RuleType } from "../../../quotation/domain/enums/RuleType";
import { AutoDetectionService, AddressData } from "@/quotation/domain/services/AutoDetectionService";
import { RULE_UUID_MONTE_MEUBLE, RULE_UUID_DISTANCE_PORTAGE } from "@/quotation/domain/constants/RuleUUIDs";

// ✅ Fonction pure en dehors du composant pour éviter les re-créations
const normalizeValue = (val: any): Record<string, boolean> => {
  if (!val || typeof val !== 'object') return {};

  // Si c'est déjà une structure plate {uuid: true}, retourner tel quel
  if (!val.addressConstraints && !val.addressServices && !val.globalServices) {
    return val;
  }

  // Si c'est une structure groupée, fusionner toutes les catégories
  const normalized: Record<string, boolean> = {};
  if (val.addressConstraints) {
    Object.assign(normalized, val.addressConstraints);
  }
  if (val.addressServices) {
    Object.assign(normalized, val.addressServices);
  }
  if (val.globalServices) {
    Object.assign(normalized, val.globalServices);
  }

  return normalized;
};

interface AccessConstraintsModalProps {
  type: 'pickup' | 'delivery';
  buttonLabel: string;
  modalTitle: string;
  value?: any;
  onChange?: (value: any) => void;
  showServices?: boolean;
  // ✅ Nouvelles props pour l'auto-détection
  floor?: number;
  elevator?: 'no' | 'small' | 'medium' | 'large';
  carryDistance?: '0-10' | '10-30' | '30+';
  volume?: number;
  formData?: any; // Données complètes du formulaire
  // 🔧 CORRECTION: Ajouter serviceType pour filtrage correct des règles
  serviceType?: ServiceType;
}

export const AccessConstraintsModal: React.FC<AccessConstraintsModalProps> = ({
  type,
  buttonLabel,
  modalTitle,
  value,
  onChange,
  showServices = true,
  floor,
  elevator,
  carryDistance,
  volume,
  formData,
  serviceType = ServiceType.MOVING // 🔧 CORRECTION: Valeur par défaut MOVING pour rétrocompatibilité
}) => {
  // ✅ Mémoriser la valeur normalisée pour éviter les recalculs
  const initialNormalizedValue = useMemo(() => {
    const normalized = normalizeValue(value);
    return normalized;
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedConstraints, setSelectedConstraints] = useState<any>(initialNormalizedValue);
  const [autoDetectionResult, setAutoDetectionResult] = useState<any>(null);
  const [blockedRuleMessage, setBlockedRuleMessage] = useState<string>('');

  // ✅ CORRECTION: Utiliser le serviceType passé en prop au lieu de hardcoder MOVING
  // ✅ NOUVEAU: Utiliser le scope pour filtrer les règles par adresse
  const { rules: constraintRules, loading: loadingConstraints, error: errorConstraints } = useUnifiedRules({
    ruleType: RuleType.CONSTRAINT,
    serviceType: serviceType, // 🔧 Utiliser la prop au lieu de ServiceType.MOVING
    condition: { 
      type,
      scope: type === 'pickup' ? 'PICKUP' : type === 'delivery' ? 'DELIVERY' : 'BOTH'
    },
    enabled: isOpen
  });

  const { rules: serviceRules, loading: loadingServices, error: errorServices } = useUnifiedRules({
    ruleType: RuleType.CUSTOM,
    serviceType: serviceType, // 🔧 Utiliser la prop au lieu de ServiceType.MOVING
    condition: { 
      type,
      scope: type === 'pickup' ? 'PICKUP' : type === 'delivery' ? 'DELIVERY' : 'BOTH'
    },
    enabled: isOpen && showServices
  });

  // ✅ AUTO-DÉTECTION: Détecter automatiquement les contraintes requises
  useEffect(() => {
    if (!isOpen || !floor) return;

    // Construire les données d'adresse depuis les props
    const addressData: AddressData = {
      floor: floor || 0,
      elevator: elevator || 'no',
      carryDistance: carryDistance,
      constraints: Object.keys(selectedConstraints || {}).filter(key => selectedConstraints?.[key] ?? false)
    };

    // Détecter monte-meuble et distance de portage
    const furnitureLiftResult = AutoDetectionService.detectFurnitureLift(addressData, volume);
    const carryingResult = AutoDetectionService.detectLongCarryingDistance(addressData);

    setAutoDetectionResult({
      furnitureLift: furnitureLiftResult,
      carrying: carryingResult
    });

    // ✅ APPLIQUER AUTOMATIQUEMENT les contraintes requises (utilise les UUIDs)
    const updatedConstraints = { ...selectedConstraints };
    let hasChanges = false;

    if (furnitureLiftResult.furnitureLiftRequired && !updatedConstraints[RULE_UUID_MONTE_MEUBLE]) {
      updatedConstraints[RULE_UUID_MONTE_MEUBLE] = true;
      hasChanges = true;
      console.log(`🏗️ [AutoDetection] Monte-meuble activé automatiquement: ${furnitureLiftResult.furnitureLiftReason}`);
    }

    if (carryingResult.longCarryingDistance && !updatedConstraints[RULE_UUID_DISTANCE_PORTAGE]) {
      updatedConstraints[RULE_UUID_DISTANCE_PORTAGE] = true;
      hasChanges = true;
      console.log(`📏 [AutoDetection] Distance de portage activée automatiquement: ${carryingResult.carryingDistanceReason}`);
    }

    if (hasChanges) {
      setSelectedConstraints(updatedConstraints);
      onChange?.(updatedConstraints);
    }
  }, [isOpen, floor, elevator, carryDistance, volume]);

  useEffect(() => {
    // ✅ Normaliser value avant comparaison
    const normalizedValue = normalizeValue(value);

    // ✅ Éviter les boucles infinies : comparer les valeurs
    if (normalizedValue && typeof normalizedValue === 'object') {
      const valueKeys = Object.keys(normalizedValue).filter(k => normalizedValue[k]);
      const currentKeys = Object.keys(selectedConstraints).filter(k => selectedConstraints[k]);

      // Comparer les clés sélectionnées
      const hasChanged =
        valueKeys.length !== currentKeys.length ||
        valueKeys.some(k => !currentKeys.includes(k));

      if (hasChanged) {
        setSelectedConstraints(normalizedValue);
      }
    }
  }, [value]);

  const handleConstraintChange = useCallback((constraints: any, blockedMessage?: string) => {
    if (blockedMessage) {
      setBlockedRuleMessage(blockedMessage);
      setTimeout(() => setBlockedRuleMessage(''), 5000);
      return;
    }

    setSelectedConstraints(constraints);

    // ✅ SÉPARATION: Départager contraintes, services d'adresse et services globaux
    const allRules = [...constraintRules, ...(showServices ? serviceRules : [])];

    const addressConstraints: Record<string, boolean> = {};
    const addressServices: Record<string, boolean> = {};
    const globalServices: Record<string, boolean> = {};

    // ✅ UUIDs des services VRAIMENT globaux (piano, stockage, etc.)
    // Ces services sont partagés entre les deux adresses
    const GLOBAL_SERVICES_UUIDS = [
      '7b09890c-9151-41e2-a017-4f478e601fc4', // Transport piano
      'eb0a68e9-c9fb-4c1d-8e78-fd307fea654d', // Stockage temporaire
    ];

    Object.entries(constraints).forEach(([ruleId, isSelected]) => {
      if (!isSelected) return;

      const rule = allRules.find(r => r.id === ruleId);
      if (!rule) {
        // Si la règle n'est pas trouvée, considérer comme contrainte d'adresse
        addressConstraints[ruleId] = true;
        return;
      }

      const categoryFrontend = rule.metadata?.category_frontend;

      if (categoryFrontend === 'service') {
        // ✅ Vérifier si c'est un service global ou lié à l'adresse
        if (GLOBAL_SERVICES_UUIDS.includes(ruleId)) {
          // Service global (piano, stockage) - une seule sélection pour tout
          globalServices[ruleId] = true;
        } else {
          // Service lié à cette adresse (monte-meuble, emballage départ/arrivée, etc.)
          addressServices[ruleId] = true;
        }
      } else {
        // Contrainte logistique liée à l'adresse
        addressConstraints[ruleId] = true;
      }
    });

    const separatedData = {
      addressConstraints,
      addressServices,  // ✅ NOUVEAU: Services spécifiques à cette adresse
      globalServices    // Services globaux partagés
    };

    onChange?.(separatedData);
    setBlockedRuleMessage('');
  }, [constraintRules, serviceRules, showServices, onChange]);

  const selectedCount = Object.keys(selectedConstraints).filter(key => selectedConstraints[key]).length;

  return (
    <div className="relative group">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between min-h-[48px] text-base font-medium border-2 border-orange-300 bg-orange-50 hover:border-orange-500 hover:bg-orange-100 transition-all duration-200"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
            onClick={() => setIsOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-600" />
              {buttonLabel}
            </span>
            {selectedCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {selectedCount}
              </span>
            )}
          </Button>
        </DialogTrigger>
        
        {/* Infobulle CSS simple */}
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          <p>
            <strong>💡 Important :</strong> Cochez les contraintes d'accès et services supplémentaires pour obtenir un devis précis. 
            Plus vous détaillez vos besoins, plus notre estimation sera exacte !
          </p>
        </div>
        
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto !pr-6">
        <DialogHeader className="text-center bg-emerald-500 pb-6 -mt-6 -mx-6 px-6 pt-6 relative">
          <DialogTitle className="text-center text-white font-medium text-xl">{modalTitle}</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-100 transition-colors hover:bg-orange-600 focus:outline-none disabled:pointer-events-none bg-orange-500 p-2 text-white">
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </DialogClose>
        </DialogHeader>

        {/* ✅ OPTIMISATION: Ne charger le contenu QUE si le modal a été ouvert au moins une fois */}
        {!isOpen ? null : loadingConstraints || loadingServices ? (
          <div className="flex items-center justify-center p-4">
            <span className="loading loading-spinner"></span>
            <span className="ml-2">Chargement...</span>
          </div>
        ) : errorConstraints || errorServices ? (
          <div className="text-red-500 p-4">
            Une erreur est survenue lors du chargement des données
          </div>
        ) : (
          <div className="space-y-6">
            {/* ✅ Message d'erreur si désélection bloquée */}
            {blockedRuleMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Cette contrainte ne peut pas être désélectionnée
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {blockedRuleMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <UnifiedRuleManagerDisplay
              rules={[
                ...constraintRules,
                ...(showServices ? serviceRules : [])
              ]}
              selectedRules={selectedConstraints}
              onChange={handleConstraintChange}
              readOnly={false}
              showActions={false}
              addressData={floor ? {
                floor: floor || 0,
                elevator: elevator || 'no',
                carryDistance: carryDistance,
                constraints: Object.keys(selectedConstraints || {}).filter(key => selectedConstraints?.[key] ?? false)
              } : undefined}
              volume={volume}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
    </div>
  );
};
