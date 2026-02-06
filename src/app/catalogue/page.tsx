"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormStylesSimplified } from "@/components/form-generator/styles/FormStylesSimplified";
import { globalFormPreset } from "@/components/form-generator/presets/_shared/globalPreset";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  TruckIcon,
  StarIcon,
  CheckIcon,
  WrenchScrewdriverIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { ServicesNavigation } from "@/components/ServicesNavigation";
import CatalogueSchema from "./schema";

// Import depuis la source unique
import {
  SERVICES,
  OPTIONS,
  SUPPLIES,
  ServiceDefinition,
  SupplyDefinition,
  formatDisplayPrice,
  calculateServicePrice,
} from "@/config/services-catalog";

// Import du contexte cross-selling
import { useCrossSellingOptional } from "@/contexts/CrossSellingContext";

// ============================================================================
// COMPOSANTS
// ============================================================================

/**
 * Carte de service avec sélection
 */
const ServiceCard: React.FC<{
  service: ServiceDefinition;
  isSelected: boolean;
  isSelectionMode: boolean;
  calculatedPrice?: number;
  onToggle: () => void;
  onClick: () => void;
  crossSelling?: ReturnType<typeof useCrossSellingOptional>;
}> = ({
  service,
  isSelected,
  isSelectionMode,
  calculatedPrice,
  onToggle,
  onClick,
  crossSelling,
}) => {
  const initialDays = crossSelling?.formContext?.storageDurationDays ?? 30;
  const [storageDurationInput, setStorageDurationInput] = useState<string>(() =>
    String(initialDays),
  );

  // Mettre à jour le contexte avec la valeur numérique (1-365), sans écraser la saisie en cours
  const numericDuration = (() => {
    const n = parseInt(storageDurationInput, 10);
    if (Number.isNaN(n) || n < 1) return 30;
    return Math.min(365, n);
  })();
  useEffect(() => {
    if (service.id === "storage" && isSelected && crossSelling) {
      crossSelling.setFormContext({
        ...crossSelling.formContext,
        storageDurationDays: numericDuration,
      });
    }
  }, [numericDuration, service.id, isSelected, crossSelling]);
  return (
    <div
      className={`bg-white rounded-xl p-2.5 sm:p-3 md:p-4 border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isSelected
          ? "border-emerald-500 bg-emerald-50 shadow-lg"
          : "border-gray-200 hover:border-emerald-300 hover:shadow-lg"
      }`}
      onClick={isSelectionMode ? onToggle : onClick}
    >
      {/* Badge */}
      {service.badge && (
        <div
          className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 text-white text-[10px] sm:text-xs md:text-xs font-bold px-1.5 sm:px-2 md:px-2 py-0.5 rounded-full"
          style={{ backgroundColor: service.badgeColor || "#f97316" }}
        >
          {service.badge}
        </div>
      )}

      {/* Indicateur de sélection */}
      {isSelectionMode && (
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
          {isSelected ? (
            <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 text-emerald-500" />
          ) : (
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 rounded-full border-2 border-gray-300 bg-white" />
          )}
        </div>
      )}

      {/* Icône */}
      <div
        className={`text-2xl sm:text-3xl md:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform ${isSelectionMode ? "mt-3 sm:mt-4 md:mt-4" : ""}`}
      >
        {service.icon}
      </div>

      {/* Titre */}
      <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
        {service.title}
      </h3>

      {/* Description */}
      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
        {service.shortDescription || service.description}
      </p>

      {/* Prix */}
      <div className="flex items-center justify-between">
        {calculatedPrice !== undefined ? (
          <span className="text-emerald-600 font-bold text-sm sm:text-base md:text-base">
            {calculatedPrice}€
          </span>
        ) : (
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs md:text-xs text-gray-500">
              à partir de
            </span>
            <span className="text-blue-600 font-semibold text-xs sm:text-sm md:text-sm">
              {formatDisplayPrice(service)}
            </span>
          </div>
        )}
        {!isSelectionMode && (
          <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4 md:h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
        )}
      </div>

      {/* Champ Durée de stockage pour Garde-meuble temporaire */}
      {service.id === "storage" && isSelected && isSelectionMode && (
        <div
          className="mt-3 pt-3 border-t border-emerald-200"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1.5">
            📦 Durée de stockage (jours)
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={storageDurationInput}
            onChange={(e) => setStorageDurationInput(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            placeholder="Ex: 30"
            aria-label="Durée de stockage en jours"
          />
          <p className="mt-1 text-[9px] sm:text-[10px] text-gray-500">
            Nombre de jours de stockage souhaité (1 à 365 jours)
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Carte de fourniture avec quantité
 */
const SupplyCard: React.FC<{
  supply: SupplyDefinition;
  quantity: number;
  isSelectionMode: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onClick: () => void;
}> = ({ supply, quantity, isSelectionMode, onAdd, onRemove, onClick }) => {
  const isSelected = quantity > 0;

  return (
    <div
      className={`bg-white rounded-xl p-2.5 sm:p-3 md:p-4 border-2 transition-all duration-300 relative overflow-hidden ${
        isSelected
          ? "border-orange-500 bg-orange-50 shadow-lg"
          : "border-gray-200 hover:border-orange-300 hover:shadow-lg"
      } ${!isSelectionMode ? "cursor-pointer group" : ""}`}
      onClick={!isSelectionMode ? onClick : undefined}
    >
      {/* Badge */}
      {supply.badge && (
        <div
          className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 text-white text-[10px] sm:text-xs md:text-xs font-bold px-1.5 sm:px-2 md:px-2 py-0.5 rounded-full"
          style={{ backgroundColor: supply.badgeColor || "#f97316" }}
        >
          {supply.badge}
        </div>
      )}

      {/* Icône */}
      <div className="text-2xl sm:text-3xl md:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
        {supply.icon}
      </div>

      {/* Titre */}
      <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base mb-1 group-hover:text-orange-700 transition-colors line-clamp-2">
        {supply.title}
      </h3>

      {/* Description */}
      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
        {supply.description}
      </p>

      {/* Prix et contrôles - deux lignes sur mobile et tablettes, une ligne sur desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-1.5 lg:gap-2">
        <span className="text-orange-600 font-bold text-sm sm:text-base md:text-base">
          {supply.price}€
          <span className="text-[10px] sm:text-xs md:text-xs text-gray-500 font-normal ml-0.5 sm:ml-1">
            /{supply.unit}
          </span>
        </span>

        {isSelectionMode ? (
          <div className="flex items-center justify-center md:justify-end gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className={`w-6 h-6 sm:w-6 sm:h-6 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all p-0 ${
                quantity > 0
                  ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                  : "bg-gray-100 text-gray-400"
              }`}
              disabled={quantity === 0}
            >
              <MinusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5" />
            </button>
            <span className="w-6 sm:w-6 md:w-6 text-center font-bold text-gray-900 text-xs sm:text-sm md:text-sm min-w-[20px]">
              {quantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="w-6 h-6 sm:w-6 sm:h-6 md:w-6 md:h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all p-0"
            >
              <PlusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center md:justify-end">
            <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4 md:h-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Total si quantité > 0 */}
      {isSelectionMode && quantity > 0 && (
        <div className="mt-2 pt-2 border-t border-orange-200 text-right">
          <span className="text-xs sm:text-sm md:text-sm text-gray-600">
            Total:{" "}
          </span>
          <span className="font-bold text-orange-600 text-xs sm:text-sm md:text-sm">
            {supply.price * quantity}€
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Barre récapitulative du panier
 */
const SelectionSummaryBar: React.FC<{
  servicesCount: number;
  suppliesCount: number;
  total: number;
  onValidate: () => void;
  onCancel: () => void;
}> = ({ servicesCount, suppliesCount, total, onValidate, onCancel }) => {
  const itemsCount = servicesCount + suppliesCount;

  if (itemsCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-emerald-500 shadow-2xl z-50 p-3 sm:p-4 md:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Mobile: Layout vertical */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-4">
          {/* Section gauche - Mobile: en haut */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-100 text-emerald-700 px-2 sm:px-3 md:px-3 py-1 sm:py-1.5 rounded-full">
              <ShoppingCartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-xs sm:text-sm md:text-base">
                {itemsCount} article{itemsCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-xs sm:text-sm md:text-base text-gray-600">
              {servicesCount > 0 && (
                <span>
                  {servicesCount} service{servicesCount > 1 ? "s" : ""}
                </span>
              )}
              {servicesCount > 0 && suppliesCount > 0 && <span> + </span>}
              {suppliesCount > 0 && (
                <span>
                  {suppliesCount} fourniture{suppliesCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Section droite - Mobile: en bas */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="text-right flex-1 sm:flex-none">
              <div className="text-xs sm:text-sm md:text-base text-gray-500">
                Total estimé
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600">
                {total.toFixed(0)}€
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="px-3 sm:px-4 md:px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-xs sm:text-sm md:text-base whitespace-nowrap min-h-[44px] sm:min-h-auto"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onValidate();
              }}
              className="px-4 sm:px-6 md:px-6 py-2.5 sm:py-3 md:py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base whitespace-nowrap min-h-[44px] sm:min-h-auto"
            >
              <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Valider la sélection</span>
              <span className="sm:hidden">Valider</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

function CatalogueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Contexte cross-selling (optionnel - peut être null si hors provider)
  const crossSelling = useCrossSellingOptional();

  // Détecter si on vient du formulaire
  const isFromForm = searchParams.get("fromForm") === "true";
  // Le chemin de retour vers le formulaire déménagement
  const returnPath = "/catalogue/catalog-demenagement-sur-mesure";

  // État local pour le mode sélection
  const [isSelectionMode, setIsSelectionMode] = useState(isFromForm);
  const [localSelectedServices, setLocalSelectedServices] = useState<
    Set<string>
  >(new Set());
  const [localSelectedSupplies, setLocalSelectedSupplies] = useState<
    Map<string, number>
  >(new Map());

  // Contexte du formulaire (passé via query params)
  const formVolume = searchParams.get("volume")
    ? parseFloat(searchParams.get("volume")!)
    : undefined;
  const formSurface = searchParams.get("surface")
    ? parseFloat(searchParams.get("surface")!)
    : undefined;

  // Ref pour éviter les appels multiples dans useEffect
  const initializationKey = useRef<string | null>(null);

  // Synchroniser avec le contexte cross-selling si disponible
  useEffect(() => {
    if (!crossSelling || !isFromForm) return;

    // Créer une clé unique basée sur les paramètres
    const currentKey = `${returnPath}-${formVolume}-${formSurface}`;

    // Ne réinitialiser que si les paramètres ont changé
    if (initializationKey.current !== currentKey) {
      crossSelling.setIsFromForm(true);
      crossSelling.setReturnPath(returnPath);
      if (formVolume || formSurface) {
        crossSelling.setFormContext({
          volume: formVolume,
          surface: formSurface,
        });
      }
      initializationKey.current = currentKey;
    }
  }, [crossSelling, isFromForm, returnPath, formVolume, formSurface]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleServiceToggle = (serviceId: string) => {
    if (crossSelling) {
      if (crossSelling.isServiceSelected(serviceId)) {
        crossSelling.removeService(serviceId);
      } else {
        crossSelling.addService(serviceId);
      }
    } else {
      // Mode local
      setLocalSelectedServices((prev) => {
        const updated = new Set(prev);
        if (updated.has(serviceId)) {
          updated.delete(serviceId);
        } else {
          updated.add(serviceId);
        }
        return updated;
      });
    }
  };

  const handleSupplyAdd = (supplyId: string) => {
    if (crossSelling) {
      crossSelling.addSupply(supplyId, 1);
    } else {
      setLocalSelectedSupplies((prev) => {
        const updated = new Map(prev);
        updated.set(supplyId, (prev.get(supplyId) || 0) + 1);
        return updated;
      });
    }
  };

  const handleSupplyRemove = (supplyId: string) => {
    if (crossSelling) {
      const currentQty = crossSelling.getSupplyQuantity(supplyId);
      if (currentQty > 1) {
        crossSelling.updateSupplyQuantity(supplyId, currentQty - 1);
      } else {
        crossSelling.removeSupply(supplyId);
      }
    } else {
      setLocalSelectedSupplies((prev) => {
        const updated = new Map(prev);
        const currentQty = prev.get(supplyId) || 0;
        if (currentQty > 1) {
          updated.set(supplyId, currentQty - 1);
        } else {
          updated.delete(supplyId);
        }
        return updated;
      });
    }
  };

  const handleServiceClick = (serviceId: string) => {
    if (isSelectionMode) {
      handleServiceToggle(serviceId);
    } else {
      router.push(
        `/catalogue/catalog-demenagement-sur-mesure?service=${serviceId}`,
      );
    }
  };

  const handleSupplyClick = (supplyId: string) => {
    if (!isSelectionMode) {
      router.push(
        `/catalogue/catalog-demenagement-sur-mesure?fourniture=${supplyId}`,
      );
    }
  };

  const handleValidateSelection = () => {
    // Retourner au formulaire avec les sélections
    // On utilise router.back() pour revenir à l'état précédent (le formulaire)
    try {
      if (isFromForm) {
        router.back();
      } else {
        router.push(returnPath);
      }
    } catch (error) {
      console.error("Error navigating back to form:", error);
      // Fallback: toujours rediriger vers le formulaire
      router.push(returnPath);
    }
  };

  const handleCancelSelection = () => {
    if (crossSelling) {
      crossSelling.clearSelection();
    }
    setLocalSelectedServices(new Set());
    setLocalSelectedSupplies(new Map());
    // Retourner au formulaire
    if (isFromForm) {
      router.back();
    } else {
      router.push(returnPath);
    }
  };

  // ============================================================================
  // CALCULS
  // ============================================================================

  const isServiceSelected = (serviceId: string) => {
    if (crossSelling) return crossSelling.isServiceSelected(serviceId);
    return localSelectedServices.has(serviceId);
  };

  const getSupplyQuantity = (supplyId: string) => {
    if (crossSelling) return crossSelling.getSupplyQuantity(supplyId);
    return localSelectedSupplies.get(supplyId) || 0;
  };

  const calculateTotal = useMemo(() => {
    if (crossSelling) {
      return crossSelling.selection.grandTotal;
    }

    // Calcul local (pas de crossSelling : pas de formContext)
    let total = 0;

    // Services (prix estimé simple)
    const priceContext = {
      volume: formVolume,
      surface: formSurface,
      storageDurationDays: undefined as number | undefined,
    };
    localSelectedServices.forEach((serviceId) => {
      const service =
        SERVICES.find((s) => s.id === serviceId) ||
        OPTIONS.find((s) => s.id === serviceId);
      if (service) {
        total += calculateServicePrice(service, priceContext);
      }
    });

    // Fournitures
    localSelectedSupplies.forEach((qty, supplyId) => {
      const supply = SUPPLIES.find((s) => s.id === supplyId);
      if (supply) {
        total += supply.price * qty;
      }
    });

    return total;
  }, [
    crossSelling,
    localSelectedServices,
    localSelectedSupplies,
    formVolume,
    formSurface,
  ]);

  const servicesCount = crossSelling
    ? crossSelling.selection.services.length
    : localSelectedServices.size;

  const suppliesCount = crossSelling
    ? crossSelling.selection.supplies.reduce((sum, s) => sum + s.quantity, 0)
    : Array.from(localSelectedSupplies.values()).reduce(
        (sum, qty) => sum + qty,
        0,
      );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 form-generator font-ios ${isSelectionMode ? "pb-28 sm:pb-32 md:pb-32" : ""}`}
    >
      <FormStylesSimplified globalConfig={globalFormPreset} />
      <CatalogueSchema />
      <ServicesNavigation />

      {/* Header avec mode sélection - optimisé mobile */}
      <div className="bg-white border-b border-gray-200 pt-16 sm:pt-20">
        <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-4">
          {isFromForm ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 md:gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-emerald-600 transition-colors text-xs sm:text-sm md:text-base"
              >
                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Retour</span>
              </button>
              <div className="text-center flex-1 sm:flex-none">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-gray-900">
                  Personnalisez votre déménagement
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">
                  Sélectionnez les services et fournitures souhaités
                </p>
              </div>
              <div className="hidden sm:block w-32" /> {/* Spacer desktop */}
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Tout pour votre déménagement
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                Services professionnels, fournitures d'emballage et options
                personnalisées
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Déménagement sur mesure (si pas en mode sélection) - optimisé mobile */}
      {!isFromForm && (
        <div className="py-3 sm:py-4 md:py-4 bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8">
            <div className="flex justify-center">
              <button
                onClick={() =>
                  router.push("/catalogue/catalog-demenagement-sur-mesure")
                }
                className="group w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 md:px-6 py-2.5 sm:py-3 md:py-3 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-base min-h-[44px] sm:min-h-auto"
              >
                <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">
                  Demander un devis déménagement
                </span>
                <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal - optimisé mobile */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        {/* Section 1: Services - optimisé mobile */}
        <div className="mb-8 sm:mb-10 md:mb-10 lg:mb-12">
          <div className="text-center mb-4 sm:mb-5 md:mb-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-100 text-blue-700 px-2.5 sm:px-3 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-xs font-semibold mb-2 sm:mb-3">
              <WrenchScrewdriverIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Services
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
              Services professionnels
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-2">
              Emballage, montage, manutention spécialisée et plus encore
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4">
            {SERVICES.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={isServiceSelected(service.id)}
                isSelectionMode={isSelectionMode}
                calculatedPrice={
                  isSelectionMode && formVolume
                    ? calculateServicePrice(service, {
                        volume: formVolume,
                        surface: formSurface,
                      })
                    : undefined
                }
                onToggle={() => handleServiceToggle(service.id)}
                onClick={() => handleServiceClick(service.id)}
              />
            ))}
          </div>
        </div>

        {/* Section 2: Options - optimisé mobile */}
        <div className="mb-8 sm:mb-10 md:mb-10 lg:mb-12">
          <div className="text-center mb-4 sm:mb-5 md:mb-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-purple-100 text-purple-700 px-2.5 sm:px-3 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-xs font-semibold mb-2 sm:mb-3">
              <ShieldCheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Options
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
              Stockage
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-2">
              Protégez vos biens et gérez la transition en toute sérénité
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4 max-w-2xl mx-auto">
            {OPTIONS.map((option) => (
              <ServiceCard
                key={option.id}
                service={option}
                isSelected={isServiceSelected(option.id)}
                isSelectionMode={isSelectionMode}
                calculatedPrice={
                  isSelectionMode && formVolume
                    ? calculateServicePrice(option, {
                        volume: formVolume,
                        surface: formSurface,
                        storageDurationDays:
                          crossSelling?.formContext?.storageDurationDays,
                      })
                    : undefined
                }
                onToggle={() => handleServiceToggle(option.id)}
                onClick={() => handleServiceClick(option.id)}
                crossSelling={crossSelling}
              />
            ))}
          </div>
        </div>

        {/* Section 3: Fournitures - optimisé mobile */}
        <div className="mb-8 sm:mb-10 md:mb-10 lg:mb-12">
          <div className="text-center mb-4 sm:mb-5 md:mb-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-orange-100 text-orange-700 px-2.5 sm:px-3 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-xs font-semibold mb-2 sm:mb-3">
              <ArchiveBoxIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Fournitures
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
              Matériels d'emballage
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-2">
              Cartons, protections et accessoires pour sécuriser vos biens
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4">
            {SUPPLIES.map((supply) => (
              <SupplyCard
                key={supply.id}
                supply={supply}
                quantity={getSupplyQuantity(supply.id)}
                isSelectionMode={isSelectionMode}
                onAdd={() => handleSupplyAdd(supply.id)}
                onRemove={() => handleSupplyRemove(supply.id)}
                onClick={() => handleSupplyClick(supply.id)}
              />
            ))}
          </div>
        </div>

        {/* Section Premium (si pas en mode sélection) - optimisé mobile */}
        {!isFromForm && (
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 py-4 sm:py-5 md:py-6 lg:py-8 rounded-xl sm:rounded-2xl">
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-100 to-blue-100 text-gray-800 px-2.5 sm:px-3 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-xs font-semibold mb-2 sm:mb-3">
                <StarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Service Premium
              </div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Déménagement Sur Mesure
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-5 md:mb-6 px-2">
                Un devis personnalisé adapté à vos besoins spécifiques
              </p>
              <button
                onClick={() =>
                  router.push("/catalogue/catalog-demenagement-sur-mesure")
                }
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-3 lg:py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base lg:text-base min-h-[44px] sm:min-h-auto"
              >
                <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">
                  Obtenir mon devis gratuit
                </span>
                <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barre récapitulative (mode sélection) */}
      {isSelectionMode && (
        <SelectionSummaryBar
          servicesCount={servicesCount}
          suppliesCount={suppliesCount}
          total={calculateTotal}
          onValidate={handleValidateSelection}
          onCancel={handleCancelSelection}
        />
      )}
    </div>
  );
}

// Wrapper avec Suspense pour useSearchParams
export default function CataloguePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du catalogue...</p>
          </div>
        </div>
      }
    >
      <CatalogueContent />
    </Suspense>
  );
}
