"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  ServiceDefinition,
  SupplyDefinition,
  SERVICES,
  OPTIONS,
  SUPPLIES,
  getServiceById,
  getSupplyById,
  calculateServicePrice,
} from "@/config/services-catalog";

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedService {
  service: ServiceDefinition;
  quantity: number;
  calculatedPrice: number;
}

export interface SelectedSupply {
  supply: SupplyDefinition;
  quantity: number;
  totalPrice: number;
}

export interface CrossSellingSelection {
  services: SelectedService[];
  supplies: SelectedSupply[];
  totalServicesPrice: number;
  totalSuppliesPrice: number;
  grandTotal: number;
}

export interface FormContext {
  volume?: number;
  surface?: number;
  declaredValue?: number;
  rooms?: number;
  hasPiano?: boolean;
  hasBulkyFurniture?: boolean;
  storageDurationDays?: number;
}

interface CrossSellingContextValue {
  // État
  selection: CrossSellingSelection;
  formContext: FormContext;
  isFromForm: boolean;
  returnPath: string | null;

  // Actions - Services
  addService: (serviceId: string, quantity?: number) => void;
  removeService: (serviceId: string) => void;
  updateServiceQuantity: (serviceId: string, quantity: number) => void;
  isServiceSelected: (serviceId: string) => boolean;

  // Actions - Fournitures
  addSupply: (supplyId: string, quantity?: number) => void;
  removeSupply: (supplyId: string) => void;
  updateSupplyQuantity: (supplyId: string, quantity: number) => void;
  isSupplySelected: (supplyId: string) => boolean;
  getSupplyQuantity: (supplyId: string) => number;

  // Actions - Contexte
  setFormContext: (context: FormContext) => void;
  setReturnPath: (path: string | null) => void;
  setIsFromForm: (isFromForm: boolean) => void;

  // Actions - Global
  clearSelection: () => void;
  getSelectionForPricing: () => CrossSellingPricingData;
}

// Données envoyées au système de pricing modulaire
export interface CrossSellingPricingData {
  // Services sélectionnés avec leurs IDs pour les modules
  packing: boolean;
  dismantling: boolean;
  reassembly: boolean;
  cleaningEnd: boolean;
  // NOTE: furnitureLift et insurancePremium SUPPRIMÉS
  // - Monte-meubles: géré par FurnitureLiftCheckbox (par adresse, seuils HIGH/CRITICAL)
  // - Assurance: gérée dans PaymentPriceSection (après scénarios multi-offres)
  storage: boolean;

  // Objets spéciaux
  hasPiano: boolean;
  hasSafe: boolean;
  hasArtwork: boolean;

  // Fournitures (prix fixes)
  suppliesTotal: number;
  suppliesDetails: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  // Totaux
  servicesTotal: number;
  grandTotal: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CrossSellingContext = createContext<CrossSellingContextValue | null>(
  null,
);

// ============================================================================
// PROVIDER
// ============================================================================

export function CrossSellingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // État des sélections
  const [selectedServices, setSelectedServices] = useState<
    Map<string, SelectedService>
  >(new Map());
  const [selectedSupplies, setSelectedSupplies] = useState<
    Map<string, SelectedSupply>
  >(new Map());

  // Contexte du formulaire (pour calcul des prix)
  const [formContext, setFormContext] = useState<FormContext>({});

  // Navigation
  const [isFromForm, setIsFromForm] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);

  // Recalculer les prix quand le contexte change
  useEffect(() => {
    if (Object.keys(formContext).length > 0) {
      // Recalculer les prix des services
      setSelectedServices((prev) => {
        const updated = new Map(prev);
        updated.forEach((selected, id) => {
          const newPrice = calculateServicePrice(selected.service, formContext);
          updated.set(id, {
            ...selected,
            calculatedPrice: newPrice * selected.quantity,
          });
        });
        return updated;
      });
    }
  }, [formContext]);

  // ============================================================================
  // ACTIONS - SERVICES
  // ============================================================================

  const addService = useCallback(
    (serviceId: string, quantity = 1) => {
      const service = getServiceById(serviceId);
      if (!service) return;

      const calculatedPrice =
        calculateServicePrice(service, formContext) * quantity;

      setSelectedServices((prev) => {
        const updated = new Map(prev);
        updated.set(serviceId, { service, quantity, calculatedPrice });
        return updated;
      });
    },
    [formContext],
  );

  const removeService = useCallback((serviceId: string) => {
    setSelectedServices((prev) => {
      const updated = new Map(prev);
      updated.delete(serviceId);
      return updated;
    });
  }, []);

  const updateServiceQuantity = useCallback(
    (serviceId: string, quantity: number) => {
      if (quantity <= 0) {
        removeService(serviceId);
        return;
      }

      setSelectedServices((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(serviceId);
        if (existing) {
          const calculatedPrice =
            calculateServicePrice(existing.service, formContext) * quantity;
          updated.set(serviceId, { ...existing, quantity, calculatedPrice });
        }
        return updated;
      });
    },
    [formContext, removeService],
  );

  const isServiceSelected = useCallback(
    (serviceId: string) => {
      return selectedServices.has(serviceId);
    },
    [selectedServices],
  );

  // ============================================================================
  // ACTIONS - FOURNITURES
  // ============================================================================

  const addSupply = useCallback((supplyId: string, quantity = 1) => {
    const supply = getSupplyById(supplyId);
    if (!supply) return;

    setSelectedSupplies((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(supplyId);
      const newQuantity = existing ? existing.quantity + quantity : quantity;
      updated.set(supplyId, {
        supply,
        quantity: newQuantity,
        totalPrice: supply.price * newQuantity,
      });
      return updated;
    });
  }, []);

  const removeSupply = useCallback((supplyId: string) => {
    setSelectedSupplies((prev) => {
      const updated = new Map(prev);
      updated.delete(supplyId);
      return updated;
    });
  }, []);

  const updateSupplyQuantity = useCallback(
    (supplyId: string, quantity: number) => {
      if (quantity <= 0) {
        removeSupply(supplyId);
        return;
      }

      setSelectedSupplies((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(supplyId);
        if (existing) {
          updated.set(supplyId, {
            ...existing,
            quantity,
            totalPrice: existing.supply.price * quantity,
          });
        }
        return updated;
      });
    },
    [removeSupply],
  );

  const isSupplySelected = useCallback(
    (supplyId: string) => {
      return selectedSupplies.has(supplyId);
    },
    [selectedSupplies],
  );

  const getSupplyQuantity = useCallback(
    (supplyId: string) => {
      return selectedSupplies.get(supplyId)?.quantity || 0;
    },
    [selectedSupplies],
  );

  // ============================================================================
  // CALCULS
  // ============================================================================

  const calculateTotals = useCallback((): CrossSellingSelection => {
    const services = Array.from(selectedServices.values());
    const supplies = Array.from(selectedSupplies.values());

    const totalServicesPrice = services.reduce(
      (sum, s) => sum + s.calculatedPrice,
      0,
    );
    const totalSuppliesPrice = supplies.reduce(
      (sum, s) => sum + s.totalPrice,
      0,
    );

    return {
      services,
      supplies,
      totalServicesPrice,
      totalSuppliesPrice,
      grandTotal: totalServicesPrice + totalSuppliesPrice,
    };
  }, [selectedServices, selectedSupplies]);

  // ============================================================================
  // ACTIONS - GLOBAL
  // ============================================================================

  const clearSelection = useCallback(() => {
    setSelectedServices(new Map());
    setSelectedSupplies(new Map());
  }, []);

  const getSelectionForPricing = useCallback((): CrossSellingPricingData => {
    const selection = calculateTotals();

    // Mapper les services vers les flags du système de pricing
    const serviceIds = Array.from(selectedServices.keys());

    return {
      packing: serviceIds.includes("packing"),
      dismantling: serviceIds.includes("dismantling"),
      reassembly: serviceIds.includes("reassembly"),
      cleaningEnd: serviceIds.includes("cleaning-end"),
      // NOTE: furnitureLift et insurancePremium supprimés (gérés ailleurs)
      storage: serviceIds.includes("storage"),

      hasPiano: serviceIds.includes("piano-handling"),
      hasSafe: serviceIds.includes("safe-handling"),
      hasArtwork: serviceIds.includes("artwork-handling"),

      suppliesTotal: selection.totalSuppliesPrice,
      suppliesDetails: selection.supplies.map((s) => ({
        id: s.supply.id,
        name: s.supply.title,
        quantity: s.quantity,
        unitPrice: s.supply.price,
        total: s.totalPrice,
      })),

      servicesTotal: selection.totalServicesPrice,
      grandTotal: selection.grandTotal,
    };
  }, [selectedServices, calculateTotals]);

  // ============================================================================
  // VALEUR DU CONTEXTE
  // ============================================================================

  const value: CrossSellingContextValue = {
    selection: calculateTotals(),
    formContext,
    isFromForm,
    returnPath,

    addService,
    removeService,
    updateServiceQuantity,
    isServiceSelected,

    addSupply,
    removeSupply,
    updateSupplyQuantity,
    isSupplySelected,
    getSupplyQuantity,

    setFormContext,
    setReturnPath,
    setIsFromForm,

    clearSelection,
    getSelectionForPricing,
  };

  return (
    <CrossSellingContext.Provider value={value}>
      {children}
    </CrossSellingContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCrossSelling() {
  const context = useContext(CrossSellingContext);
  if (!context) {
    throw new Error(
      "useCrossSelling must be used within a CrossSellingProvider",
    );
  }
  return context;
}

// ============================================================================
// HOOK OPTIONNEL (ne throw pas si hors du provider)
// ============================================================================

export function useCrossSellingOptional() {
  return useContext(CrossSellingContext);
}
