"use client";

import React from 'react';

interface RuleCardProps {
  rule: {
    id: string;
    name: string;
    description?: string;
    value: number;
    percentBased: boolean;
    serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY';
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
  };
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  isSelected,
  onToggle,
  disabled = false,
}) => {
  const icon = rule.metadata?.display?.icon;
  const description = rule.metadata?.display?.description_short || rule.description;
  const impact = rule.metadata?.impact || (rule.percentBased ? `+${rule.value}%` : `+${rule.value}€`);
  const group = rule.metadata?.display?.group;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!disabled) {
      onToggle();
    }
  };

  const handleDivClick = (e: React.MouseEvent) => {
    if (!disabled) {
      onToggle();
    }
  };

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-200 transform hover:-translate-y-0.5
        ${isSelected
          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
          : 'border-gray-200 hover:border-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={handleDivClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            <h4 className="font-medium text-gray-900">{rule.name}</h4>
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
