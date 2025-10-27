"use client";

import { useState } from "react";
import { RuleCard } from "./RuleCard";
import { AutoDetectionService, AddressData } from "@/quotation/domain/services/AutoDetectionService";

interface Rule {
  id: string;
  name: string;
  description?: string;
  value: number;
  isActive: boolean;
  ruleType: string;
  category: string;
  condition?: any;
  percentBased: boolean;
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY';
  priority: number;
  tags: string[];
  metadata?: {
    impact?: string;
    category_frontend?: "constraint" | "service";
      display?: {
        icon?: string;
        priority?: number;
        group?: string;
        description_short?: string;
      };
  };
}

interface UnifiedRuleManagerDisplayProps {
  rules: Rule[];
  selectedRules: Record<string, boolean>;
  onChange: (selectedRules: Record<string, boolean>, blockedMessage?: string) => void;
  readOnly?: boolean;
  showActions?: boolean;
  addressData?: AddressData;
  volume?: number;
}

export function UnifiedRuleManagerDisplay({
  rules,
  selectedRules,
  onChange,
  readOnly = false,
  showActions = true,
  addressData,
  volume,
}: UnifiedRuleManagerDisplayProps) {
  const handleToggleRule = (rule: Rule) => {
    if (readOnly) return;

    const isCurrentlySelected = selectedRules[rule.id];

    // ✅ Si tentative de DÉSÉLECTION, valider que c'est autorisé
    if (isCurrentlySelected && addressData) {
      const currentSelectedIds = Object.keys(selectedRules).filter(k => selectedRules[k]);
      const newSelectedIds = currentSelectedIds.filter(id => id !== rule.id);

      const validation = AutoDetectionService.validateConstraintSelection(
        currentSelectedIds,
        newSelectedIds,
        addressData,
        volume
      );

      if (!validation.isValid) {
        onChange(selectedRules, validation.reason);
        return;
      }
    }

    // ✅ Autoriser la sélection/désélection
    const newSelectedRules = {
      ...selectedRules,
      [rule.id]: !selectedRules[rule.id],
    };

    onChange(newSelectedRules);
  };

  // Traduction des groupes fonctionnels
  const translateGroup = (group: string): string => {
    const translations: Record<string, string> = {
      'vehicle_access': 'Accès véhicule',
      'parking': 'Stationnement',
      'building_access': 'Accès bâtiment',
      'floor_access': 'Accès étage',
      'time_constraints': 'Contraintes horaires',
      'special_handling': 'Manipulation spéciale',
      'packing': 'Emballage',
      'assembly': 'Montage/Démontage',
      'cleaning': 'Nettoyage',
      'storage': 'Stockage',
      'security': 'Sécurité',
      'other': 'Autres'
    };
    return translations[group] || group.replace(/_/g, ' ');
  };

  // Grouper les règles par catégorie et groupe
  const groupedRules = rules.reduce((acc, rule) => {
    const category = rule.metadata?.category_frontend || 'other';
    const group = rule.metadata?.display?.group || 'other';
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][group]) {
      acc[category][group] = [];
    }
    acc[category][group].push(rule);
    return acc;
  }, {} as Record<string, Record<string, Rule[]>>);

  // Icônes par catégorie
  const categoryIcons = {
    constraint: '🚧',
    service: '🛠️',
    other: '📋'
  };

  // Titres par catégorie
  const categoryTitles = {
    constraint: 'Contraintes d\'accès',
    service: 'Services additionnels',
    other: 'Autres règles'
  };

  // Couleurs par service
  const serviceColors = {
    MOVING: 'emerald',
    CLEANING: 'blue',
    DELIVERY: 'purple'
  };

  return (
    <div className="space-y-12">
      {Object.entries(groupedRules).map(([category, groups]) => (
        <div key={category} className={`${category}-section`}>
          <h3 className="text-xl font-medium mb-6 flex items-center gap-2 pb-2 border-b">
            <span className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
            <span className={category === 'constraint' ? 'text-orange-500' : 'text-blue-500'}>
              {categoryTitles[category as keyof typeof categoryTitles]}
            </span>
          </h3>

          <div className="space-y-8">
            {Object.entries(groups).map(([group, groupRules]) => (
              <div key={group} className="group-section">
                {group !== 'other' && (
                  <h4 className="text-lg font-medium mb-4 text-gray-700">
                    {translateGroup(group)}
                  </h4>
                )}

                <div className="grid gap-4">
                  {groupRules
                    .sort((a, b) => (a.metadata?.display?.priority || 0) - (b.metadata?.display?.priority || 0))
                    .map(rule => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        isSelected={selectedRules[rule.id] || false}
                        onToggle={() => handleToggleRule(rule)}
                        disabled={readOnly}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
