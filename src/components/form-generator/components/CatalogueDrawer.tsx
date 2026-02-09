"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  WrenchScrewdriverIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import {
  SERVICES,
  OPTIONS,
  SUPPLIES,
  ServiceDefinition,
  SupplyDefinition,
  formatDisplayPrice,
  calculateServicePrice,
} from "@/config/services-catalog";
import { useCrossSellingOptional } from "@/contexts/CrossSellingContext";

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

/**
 * Carte de service avec sélection
 */
const ServiceCard: React.FC<{
  service: ServiceDefinition;
  isSelected: boolean;
  calculatedPrice?: number;
  onToggle: () => void;
  crossSelling?: ReturnType<typeof useCrossSellingOptional>;
}> = ({ service, isSelected, calculatedPrice, onToggle, crossSelling }) => {
  const initialDays = crossSelling?.formContext?.storageDurationDays ?? 30;
  const [storageDurationInput, setStorageDurationInput] = useState<string>(() =>
    String(initialDays),
  );

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
      className={`bg-white rounded-xl p-2.5 sm:p-3 border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isSelected
          ? "border-emerald-500 bg-emerald-50 shadow-lg"
          : "border-gray-200 hover:border-emerald-300 hover:shadow-lg"
      }`}
      onClick={onToggle}
    >
      {service.badge && (
        <div
          className="absolute top-1.5 right-1.5 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: service.badgeColor || "#f97316" }}
        >
          {service.badge}
        </div>
      )}

      <div className="absolute top-1.5 left-1.5">
        {isSelected ? (
          <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
        )}
      </div>

      <div className="text-2xl mb-2 mt-3 group-hover:scale-110 transition-transform">
        {service.icon}
      </div>

      <h3 className="font-bold text-gray-900 text-xs mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
        {service.title}
      </h3>

      <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">
        {service.shortDescription || service.description}
      </p>

      <div className="flex items-center justify-between">
        {calculatedPrice !== undefined ? (
          <span className="text-emerald-600 font-bold text-sm">
            {calculatedPrice}€
          </span>
        ) : (
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500">à partir de</span>
            <span className="text-blue-600 font-semibold text-xs">
              {formatDisplayPrice(service)}
            </span>
          </div>
        )}
      </div>

      {service.id === "storage" && isSelected && (
        <div
          className="mt-3 pt-3 border-t border-emerald-200"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <label className="block text-[10px] font-medium text-gray-700 mb-1.5">
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
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            placeholder="Ex: 30"
          />
          <p className="mt-1 text-[9px] text-gray-500">
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
  onAdd: () => void;
  onRemove: () => void;
}> = ({ supply, quantity, onAdd, onRemove }) => {
  const isSelected = quantity > 0;

  return (
    <div
      className={`bg-white rounded-xl p-2.5 sm:p-3 border-2 transition-all duration-300 relative overflow-hidden ${
        isSelected
          ? "border-orange-500 bg-orange-50 shadow-lg"
          : "border-gray-200 hover:border-orange-300 hover:shadow-lg"
      }`}
    >
      {supply.badge && (
        <div
          className="absolute top-1.5 right-1.5 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: supply.badgeColor || "#f97316" }}
        >
          {supply.badge}
        </div>
      )}

      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
        {supply.icon}
      </div>

      <h3 className="font-bold text-gray-900 text-xs mb-1 group-hover:text-orange-700 transition-colors line-clamp-2">
        {supply.title}
      </h3>

      <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">
        {supply.description}
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-orange-600 font-bold text-sm">
          {supply.price}€
          <span className="text-[10px] text-gray-500 font-normal ml-0.5">
            /{supply.unit}
          </span>
        </span>

        <div className="flex items-center justify-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all p-0 ${
              quantity > 0
                ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                : "bg-gray-100 text-gray-400"
            }`}
            disabled={quantity === 0}
          >
            <MinusIcon className="w-3 h-3" />
          </button>
          <span className="w-6 text-center font-bold text-gray-900 text-xs min-w-[20px]">
            {quantity}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all p-0"
          >
            <PlusIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {quantity > 0 && (
        <div className="mt-2 pt-2 border-t border-orange-200 text-right">
          <span className="text-xs text-gray-600">Total: </span>
          <span className="font-bold text-orange-600 text-xs">
            {supply.price * quantity}€
          </span>
        </div>
      )}
    </div>
  );
};

export interface CatalogueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: Record<string, unknown>;
}

export const CatalogueDrawer: React.FC<CatalogueDrawerProps> = ({
  isOpen,
  onClose,
  formData,
}) => {
  const isMobile = useIsMobile();
  const crossSelling = useCrossSellingOptional();

  const estimatedVolume = formData?.estimatedVolume as number | undefined;
  const surface = (formData?.surface as number) || 0;

  const [localSelectedServices, setLocalSelectedServices] = useState<
    Set<string>
  >(new Set());
  const [localSelectedSupplies, setLocalSelectedSupplies] = useState<
    Map<string, number>
  >(new Map());

  useEffect(() => {
    if (!isOpen || !crossSelling) return;
    crossSelling.setFormContext({
      volume: estimatedVolume,
      surface,
    });
  }, [isOpen, crossSelling, estimatedVolume, surface]);

  const handleServiceToggle = (serviceId: string) => {
    if (crossSelling) {
      if (crossSelling.isServiceSelected(serviceId)) {
        crossSelling.removeService(serviceId);
      } else {
        crossSelling.addService(serviceId);
      }
    } else {
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

  const isServiceSelected = (serviceId: string) => {
    if (crossSelling) return crossSelling.isServiceSelected(serviceId);
    return localSelectedServices.has(serviceId);
  };

  const getSupplyQuantity = (supplyId: string) => {
    if (crossSelling) return crossSelling.getSupplyQuantity(supplyId);
    return localSelectedSupplies.get(supplyId) || 0;
  };

  const servicesCount = crossSelling
    ? crossSelling.selection.services.length
    : localSelectedServices.size;

  const suppliesCount = crossSelling
    ? crossSelling.selection.supplies.reduce((sum, s) => sum + s.quantity, 0)
    : Array.from(localSelectedSupplies.values()).reduce(
        (sum, qty) => sum + qty,
        0,
      );

  const calculateTotal = useMemo(() => {
    if (crossSelling) {
      return crossSelling.selection.grandTotal;
    }

    let total = 0;
    const priceContext = {
      volume: estimatedVolume,
      surface,
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
    estimatedVolume,
    surface,
  ]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const drawerContent = (
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
            ? "fixed inset-x-0 bottom-0 top-[10%] rounded-t-2xl bg-white shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300 ease-out"
            : "fixed right-0 top-0 bottom-0 w-full max-w-[600px] bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 ease-out"
        }
        style={{ zIndex: DRAWER_PANEL_Z }}
        aria-modal="true"
        aria-labelledby="catalogue-drawer-title"
        role="dialog"
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white rounded-t-2xl px-4 py-3">
          <h2
            id="catalogue-drawer-title"
            className="text-lg font-semibold text-gray-900 flex-1 min-w-0 truncate pr-2"
          >
            Catalogue
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
          {/* Section Services */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2">
                <WrenchScrewdriverIcon className="w-2.5 h-2.5" />
                Services
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Services professionnels
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SERVICES.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={isServiceSelected(service.id)}
                  calculatedPrice={
                    estimatedVolume
                      ? calculateServicePrice(service, {
                          volume: estimatedVolume,
                          surface,
                        })
                      : undefined
                  }
                  onToggle={() => handleServiceToggle(service.id)}
                  crossSelling={crossSelling}
                />
              ))}
            </div>
          </div>

          {/* Section Options */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2">
                <ShieldCheckIcon className="w-2.5 h-2.5" />
                Options
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Stockage
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
              {OPTIONS.map((option) => (
                <ServiceCard
                  key={option.id}
                  service={option}
                  isSelected={isServiceSelected(option.id)}
                  calculatedPrice={
                    estimatedVolume
                      ? calculateServicePrice(option, {
                          volume: estimatedVolume,
                          surface,
                          storageDurationDays:
                            crossSelling?.formContext?.storageDurationDays,
                        })
                      : undefined
                  }
                  onToggle={() => handleServiceToggle(option.id)}
                  crossSelling={crossSelling}
                />
              ))}
            </div>
          </div>

          {/* Section Fournitures */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2">
                <ArchiveBoxIcon className="w-2.5 h-2.5" />
                Fournitures
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Matériels d'emballage
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {SUPPLIES.map((supply) => (
                <SupplyCard
                  key={supply.id}
                  supply={supply}
                  quantity={getSupplyQuantity(supply.id)}
                  onAdd={() => handleSupplyAdd(supply.id)}
                  onRemove={() => handleSupplyRemove(supply.id)}
                />
              ))}
            </div>
          </div>

          {/* Barre récapitulative fixe en bas */}
          {(servicesCount > 0 || suppliesCount > 0) && (
            <div className="sticky bottom-0 bg-white border-t-2 border-emerald-500 shadow-2xl -mx-4 px-4 py-3 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    <CheckIcon className="w-4 h-4" />
                    <span className="font-bold text-xs">
                      {servicesCount + suppliesCount} article
                      {servicesCount + suppliesCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
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
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total estimé</div>
                    <div className="text-lg font-bold text-emerald-600">
                      {calculateTotal.toFixed(0)}€
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
};
