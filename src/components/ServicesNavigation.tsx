'use client';

import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  SparklesIcon, 
  CubeIcon, 
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export const ServicesNavigation: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-30 border-b border-gray-600" style={{ backgroundColor: '#242F3E' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-center py-3">
          <div className="flex items-center space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide">
            <a href="/catalogue/catalog-demenagement-sur-mesure" className="text-xs sm:text-sm font-normal text-white hover:text-emerald-400 transition-colors whitespace-nowrap px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
              <TruckIcon className="h-4 w-4" />
              Déménagement Sur Mesure
            </a>
            <a href="/catalogue/catalog-menage-sur-mesure" className="text-xs sm:text-sm font-normal text-white hover:text-emerald-400 transition-colors whitespace-nowrap px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              Ménage Sur Mesure
            </a>
            <a href="/catalogue" className="text-xs sm:text-sm font-normal text-white hover:text-emerald-400 transition-colors whitespace-nowrap px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
              <ArrowPathIcon className="h-4 w-4" />
              Livraison
            </a>
            <a href="/catalogue" className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-orange-200 transition-colors whitespace-nowrap px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
              <CubeIcon className="h-4 w-4" />
              Forfaits Personnalisables
            </a>
            <a href="/catalogue/catalog-menage-sur-mesure" className="text-xs sm:text-sm font-normal text-white hover:text-emerald-400 transition-colors whitespace-nowrap px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
              <BuildingOfficeIcon className="h-4 w-4" />
              Nettoyage Bureaux
            </a>
            <a href="/catalogue/catalog-menage-sur-mesure" className="text-xs sm:text-sm font-normal text-white hover:text-emerald-400 transition-colors whitespace-nowrap px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-4 w-4" />
              Nettoyage Après Travaux
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
};
