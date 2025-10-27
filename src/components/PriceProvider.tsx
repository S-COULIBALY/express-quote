'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PriceContextType {
  calculatedPrice: number;
  basePrice: number;
  priceDetails?: {
    breakdown?: Record<string, number>;
    appliedRules?: Array<{
      name: string;
      description: string;
      price: number;
    }>;
    currency?: string;
  };
  updatePrice: (price: number, details?: any) => void;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

interface PriceProviderProps {
  children: ReactNode;
  initialPrice: number;
}

export const PriceProvider: React.FC<PriceProviderProps> = ({ children, initialPrice }) => {
  const [calculatedPrice, setCalculatedPrice] = useState(initialPrice);
  const [basePrice] = useState(initialPrice);
  const [priceDetails, setPriceDetails] = useState<any>(undefined);

  const updatePrice = useCallback((price: number, details?: any) => {
    setCalculatedPrice(price);
    if (details) {
      setPriceDetails(details);
    }
  }, []);

  const value: PriceContextType = {
    calculatedPrice,
    basePrice,
    priceDetails,
    updatePrice,
  };

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
};

export const usePrice = (): PriceContextType => {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
};
