"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
// ✅ Seules les contraintes d'accès sont gérées ici
// Les services et fournitures sont maintenant gérés via le catalogue cross-selling
import { ACCESS_CONSTRAINTS, AUTO_DETECTED_CONSTRAINT_IDS } from "./modal-data";

// Seuils d'étage pour la gradation de la recommandation monte-meubles
const HIGH_FLOOR_THRESHOLD = 3; // Étage ≥ 3 = HIGH
const CRITICAL_FLOOR_THRESHOLD = 5; // Étage ≥ 5 = CRITICAL

// Types de sévérité pour le monte-meubles
type FurnitureLiftSeverity = 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ✅ Fonction d'auto-détection locale avec gradation (découplée de la BDD)
const detectFurnitureLift = (floor: number, elevator: 'no' | 'small' | 'medium' | 'large'): boolean => {
  // Monte-meuble requis si étage > 0 ET pas d'ascenseur adapté
  return floor > 0 && (elevator === 'no' || elevator === 'small');
};

// ✅ Détermine la sévérité de la recommandation monte-meubles
const getFurnitureLiftSeverity = (floor: number, elevator: 'no' | 'small' | 'medium' | 'large'): FurnitureLiftSeverity => {
  if (!detectFurnitureLift(floor, elevator)) {
    return 'NONE';
  }
  if (floor >= CRITICAL_FLOOR_THRESHOLD) {
    return 'CRITICAL';
  }
  if (floor >= HIGH_FLOOR_THRESHOLD) {
    return 'HIGH';
  }
  return 'MEDIUM';
};

// ✅ Messages d'avertissement selon la sévérité
const getFurnitureLiftWarning = (severity: FurnitureLiftSeverity, floor: number): { message: string; className: string } | null => {
  switch (severity) {
    case 'CRITICAL':
      return {
        message: `🚨 CRITIQUE : Étage ${floor} sans ascenseur adapté. Le monte-meubles est OBLIGATOIRE à cette hauteur. Le portage manuel est extrêmement dangereux et quasi-impossible pour les meubles lourds.`,
        className: 'bg-red-100 border-red-500 text-red-800'
      };
    case 'HIGH':
      return {
        message: `⚠️ FORTEMENT RECOMMANDÉ : Étage ${floor} sans ascenseur adapté. À partir du 3ème étage, le risque de casse et de blessure augmente significativement. Le monte-meubles est fortement conseillé.`,
        className: 'bg-orange-100 border-orange-500 text-orange-800'
      };
    case 'MEDIUM':
      return {
        message: `💡 Recommandé : Étage ${floor} sans ascenseur adapté. Le monte-meubles permet de réduire le risque de casse et facilite le déménagement.`,
        className: 'bg-yellow-100 border-yellow-500 text-yellow-800'
      };
    default:
      return null;
  }
};

const detectLongCarryingDistance = (carryDistance?: '0-10' | '10-30' | '30+'): boolean => {
  // Distance longue si > 30m
  return carryDistance === '30+';
};

/** z-index pour overlay et panel (aligné sur VolumeCalculatorDrawer) */
const DRAWER_OVERLAY_Z = 100;
const DRAWER_PANEL_Z = 101;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

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

interface LogisticsModalProps {
  type: 'pickup' | 'delivery';
  buttonLabel: string;
  modalTitle: string;
  value?: any;
  onChange?: (value: any) => void;
  showServices?: boolean; // Kept for backwards compatibility but ignored (services now in catalogue)
  // Props pour l'auto-détection des contraintes
  floor?: number;
  elevator?: 'no' | 'small' | 'medium' | 'large';
  carryDistance?: '0-10' | '10-30' | '30+';
}

export const LogisticsModal: React.FC<LogisticsModalProps> = ({
  type,
  buttonLabel,
  modalTitle,
  value,
  onChange,
  // showServices is now ignored - services are managed via cross-selling catalogue
  floor,
  elevator,
  carryDistance,
}) => {
  // ✅ Mémoriser la valeur normalisée pour éviter les recalculs
  const initialNormalizedValue = useMemo(() => {
    const normalized = normalizeValue(value);
    return normalized;
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const [selectedRules, setSelectedRules] = useState<any>(initialNormalizedValue);
  const [blockedRuleMessage, setBlockedRuleMessage] = useState<string>('');

  const handleClose = useCallback(() => setIsOpen(false), []);

  // ✅ Calculer la sévérité du monte-meubles pour l'avertissement
  const furnitureLiftSeverity = useMemo(() => {
    if (floor === undefined) return 'NONE' as FurnitureLiftSeverity;
    return getFurnitureLiftSeverity(floor, elevator || 'no');
  }, [floor, elevator]);

  const furnitureLiftWarning = useMemo(() => {
    if (floor === undefined) return null;
    return getFurnitureLiftWarning(furnitureLiftSeverity, floor);
  }, [furnitureLiftSeverity, floor]);

  // ✅ Filtrer les contraintes d'accès selon le scope et le type
  // Note: Les services sont maintenant gérés via le catalogue cross-selling
  const scope = type === 'pickup' ? 'PICKUP' : type === 'delivery' ? 'DELIVERY' : 'BOTH';

  const constraintRules = useMemo(() => {
    return ACCESS_CONSTRAINTS.filter((rule) =>
      rule.scope === scope || rule.scope === 'BOTH' || rule.scope === 'GLOBAL'
    );
  }, [scope]);

  // ✅ AUTO-DÉTECTION: Détecter automatiquement les contraintes requises
  useEffect(() => {
    if (!isOpen || floor === undefined) return;

    // Détecter distance de portage longue (logique locale)
    const longCarryingDistance = detectLongCarryingDistance(carryDistance);

    // ✅ APPLIQUER AUTOMATIQUEMENT les contraintes requises
    const updatedRules = { ...selectedRules };
    let hasChanges = false;

    // Auto-détection de la distance de portage > 30m
    if (longCarryingDistance && !updatedRules[AUTO_DETECTED_CONSTRAINT_IDS.DISTANCE_PORTAGE]) {
      updatedRules[AUTO_DETECTED_CONSTRAINT_IDS.DISTANCE_PORTAGE] = true;
      hasChanges = true;
      console.log(`📏 [AutoDetection] Distance de portage activée automatiquement: Distance > 30m`);
    }

    if (hasChanges) {
      setSelectedRules(updatedRules);
      onChange?.(updatedRules);
    }
  }, [isOpen, floor, elevator, carryDistance]);

  useEffect(() => {
    // ✅ Normaliser value avant comparaison
    const normalizedValue = normalizeValue(value);

    // ✅ Éviter les boucles infinies : comparer les valeurs
    if (normalizedValue && typeof normalizedValue === 'object') {
      const valueKeys = Object.keys(normalizedValue).filter(k => normalizedValue[k]);
      const currentKeys = Object.keys(selectedRules).filter(k => selectedRules[k]);

      // Comparer les clés sélectionnées
      const hasChanged =
        valueKeys.length !== currentKeys.length ||
        valueKeys.some(k => !currentKeys.includes(k));

      if (hasChanged) {
        setSelectedRules(normalizedValue);
      }
    }
  }, [value]);

  const handleRulesChange = useCallback((rules: any, blockedMessage?: string) => {
    if (blockedMessage) {
      setBlockedRuleMessage(blockedMessage);
      setTimeout(() => setBlockedRuleMessage(''), 5000);
      return;
    }

    setSelectedRules(rules);

    // ✅ SIMPLIFIÉ: Seules les contraintes d'accès sont gérées ici
    // Les services sont maintenant gérés via le catalogue cross-selling
    const addressConstraints: Record<string, boolean> = {};

    Object.entries(rules).forEach(([ruleId, isSelected]) => {
      if (!isSelected) return;

      // Vérifier si c'est une contrainte connue
      const isKnownConstraint = constraintRules.some(c => c.id === ruleId);
      if (isKnownConstraint) {
        addressConstraints[ruleId] = true;
      }
    });

    const separatedData = {
      addressConstraints,
    };

    onChange?.(separatedData);
    setBlockedRuleMessage('');
  }, [constraintRules, onChange]);

  const selectedCount = Object.keys(selectedRules).filter(key => selectedRules[key]).length;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  const drawerContent = isOpen ? (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Fermer"
        className="fixed inset-0 bg-black/40 animate-in fade-in duration-200"
        style={{ zIndex: DRAWER_OVERLAY_Z }}
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Enter" && handleClose()}
      />
      <div
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 top-[15%] rounded-t-2xl bg-white shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300 ease-out"
            : "fixed right-0 top-0 bottom-0 w-full max-w-[480px] sm:max-w-[520px] bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 ease-out"
        }
        style={{ zIndex: DRAWER_PANEL_Z }}
        aria-modal="true"
        aria-labelledby="logistics-drawer-title"
        role="dialog"
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white rounded-t-2xl px-4 py-3">
          <h2 id="logistics-drawer-title" className="text-lg font-semibold text-gray-900 flex-1 min-w-0 truncate pr-2">
            {modalTitle}
          </h2>
          <span className="inline-flex flex-shrink-0" style={{ width: 36, height: 36 }}>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 active:scale-[0.98] transition-colors w-full h-full p-0 min-w-0"
              style={{ width: 36, height: 36 }}
              aria-label="Fermer"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6">
            {/* ✅ Avertissement monte-meubles gradé selon l'étage */}
            {furnitureLiftWarning && (
              <div className={`border-l-4 rounded-lg p-4 ${furnitureLiftWarning.className}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {furnitureLiftSeverity === 'CRITICAL' ? (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : furnitureLiftSeverity === 'HIGH' ? (
                      <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-bold ${
                      furnitureLiftSeverity === 'CRITICAL' ? 'text-red-900' :
                      furnitureLiftSeverity === 'HIGH' ? 'text-orange-900' : 'text-yellow-900'
                    }`}>
                      {furnitureLiftSeverity === 'CRITICAL' ? 'Monte-meubles OBLIGATOIRE' :
                       furnitureLiftSeverity === 'HIGH' ? 'Monte-meubles fortement recommandé' : 'Monte-meubles recommandé'}
                    </h3>
                    <p className="mt-1 text-sm">
                      {furnitureLiftWarning.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* ✅ Liste des contraintes d'accès sélectionnables */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Contraintes d'accès ({type === 'pickup' ? 'Départ' : 'Arrivée'})
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Sélectionnez les contraintes qui s'appliquent à cette adresse. Ces contraintes impactent le prix du déménagement.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {constraintRules.map((constraint) => {
                  const isSelected = selectedRules[constraint.id] || false;
                  return (
                    <button
                      key={constraint.id}
                      type="button"
                      onClick={() => {
                        const newRules = {
                          ...selectedRules,
                          [constraint.id]: !isSelected
                        };
                        handleRulesChange(newRules);
                      }}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left
                        ${isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <div className={`
                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                        ${isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{constraint.metadata?.display?.icon || '📋'}</span>
                          <span className="text-sm font-medium text-gray-900">{constraint.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{constraint.description}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                          {constraint.metadata?.impact || `+${constraint.value}%`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ✅ Info sur les services */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-sm font-medium text-blue-900">Services et fournitures</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Les services supplémentaires (emballage, monte-meuble, etc.) et les fournitures (cartons, protections...)
                    sont disponibles dans le catalogue. Utilisez le bouton "Services & Fournitures" du formulaire pour les ajouter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="relative group">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-left font-normal"
        onClick={() => setIsOpen(true)}
      >
        <span className="truncate">
          {selectedCount > 0
            ? `${selectedCount} ${selectedCount === 1 ? 'élément sélectionné' : 'éléments sélectionnés'}`
            : buttonLabel}
        </span>
        <Info className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {selectedCount === 0 && (
        <p className="mt-0.5 text-[10px] sm:text-[11px] text-gray-400 opacity-60 italic">
          Cliquez pour sélectionner des contraintes d'accès
        </p>
      )}

      {typeof document !== "undefined" && createPortal(drawerContent, document.body)}
    </div>
  );
};

