"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCrossSellingOptional } from "@/contexts";

interface CrossSellingButtonProps {
  formData?: Record<string, unknown>;
  onChange?: (value: unknown) => void;
  value?: unknown;
  /** Variante compacte pour carte FLEX ou colonne tableau */
  compact?: boolean;
}

/**
 * Bouton pour rediriger vers le catalogue en mode sélection cross-selling
 * Permet aux clients de sélectionner des services et fournitures supplémentaires
 */
export const CrossSellingButton: React.FC<CrossSellingButtonProps> = ({
  formData,
  compact = false,
}) => {
  const router = useRouter();
  const crossSelling = useCrossSellingOptional();

  // Extraire les données du formulaire pour le contexte (volume en m³)
  const estimatedVolume = formData?.estimatedVolume as number | undefined;
  const volumeEstimeStr = (formData?.volumeEstime as string) || "";
  const surface = (formData?.surface as number) || 0;

  const getVolumeNumber = (volumeStr: string): number => {
    const volumeMap: Record<string, number> = {
      "tres-petit": 10,
      "moyen-1": 20,
      "moyen-2": 30,
      "moyen-intermediaire": 42,
      "moyen-grand": 60,
      grand: 85,
      "tres-grand": 120,
    };
    return volumeMap[volumeStr] || 30;
  };

  const volume =
    estimatedVolume != null && estimatedVolume > 0
      ? estimatedVolume
      : getVolumeNumber(volumeEstimeStr);

  // Compter les services/fournitures déjà sélectionnés
  // Utiliser useMemo pour optimiser et forcer la réactivité
  const selectedCount = useMemo(() => {
    if (!crossSelling) return 0;
    // Utiliser directement l'objet selection pour forcer le re-render quand il change
    const servicesCount = crossSelling.selection.services.length;
    const suppliesCount = crossSelling.selection.supplies.reduce(
      (acc, s) => acc + s.quantity,
      0,
    );
    return servicesCount + suppliesCount;
  }, [crossSelling?.selection]);

  const handleClick = () => {
    // Construire l'URL avec les paramètres du formulaire
    const params = new URLSearchParams({
      fromForm: "true",
      volume: String(volume),
      surface: String(surface),
    });

    // Stocker le contexte du formulaire si le provider existe
    if (crossSelling) {
      crossSelling.setFormContext({
        volume,
        surface,
      });
    }

    // Rediriger vers le catalogue en mode sélection
    router.push(`/catalogue?${params.toString()}`);
  };

  if (compact) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 sm:py-2
                     bg-orange-300 hover:bg-orange-400 border-0 rounded-lg transition-all duration-200
                     shadow-sm hover:shadow text-center group min-h-[36px] sm:min-h-[40px]"
        >
          <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-orange-400/50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span className="font-semibold text-orange-900 text-[10px] sm:text-xs truncate flex-1 text-center">
            À la carte
          </span>
          {selectedCount > 0 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-orange-500/40 text-orange-900 text-[9px] sm:text-[10px] font-medium rounded-full">
              {selectedCount}
            </span>
          )}
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-800 group-hover:text-orange-900 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5
                   bg-gradient-to-r from-blue-50 to-indigo-50
                   hover:from-blue-100 hover:to-indigo-100
                   border-2 border-blue-200 hover:border-blue-300
                   rounded-xl transition-all duration-200
                   shadow-sm hover:shadow-md
                   group min-h-[56px] sm:min-h-auto"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Icône - optimisé mobile */}
          <div
            className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600
                          flex items-center justify-center shadow-md
                          group-hover:scale-105 transition-transform duration-200"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>

          {/* Texte - optimisé mobile */}
          <div className="text-left flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base truncate">
              Services & Fournitures
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 truncate">
              {selectedCount > 0
                ? `${selectedCount} élément${selectedCount > 1 ? "s" : ""} sélectionné${selectedCount > 1 ? "s" : ""}`
                : "Cartons, emballage, monte-meuble..."}
            </div>
          </div>
        </div>

        {/* Badge de sélection ou flèche - optimisé mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {selectedCount > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-medium rounded-full">
              {selectedCount}
            </span>
          )}
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-500
                       group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>

      {/* Texte d'aide - optimisé mobile */}
      <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500 text-center">
        💡 Parcourez notre catalogue pour ajouter des options à votre
        déménagement
      </p>
    </div>
  );
};

export default CrossSellingButton;
