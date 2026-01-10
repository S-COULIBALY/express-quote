import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface CatalogueCardProps {
  item: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    price: number;
    originalPrice?: number;
    features: string[];
    category: string;
    subcategory: string;
    badgeText?: string;
    badgeColor?: string;
    isNewOffer?: boolean;
    isFeatured?: boolean;
  };
  icon: React.ComponentType<{ className?: string }>;
  categoryColor: string;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CatalogueCard: React.FC<CatalogueCardProps> = ({
  item,
  icon: IconComponent,
  categoryColor,
  onClick,
  className,
  style
}) => {
  // Couleurs des badges selon le type - versions adoucies et discrètes
  const getBadgeColor = (badgeText: string): string => {
    switch (badgeText.toLowerCase()) {
      case "promo":
        return "#fef3c7"; // Jaune très clair
      case "populaire":
        return "#fed7aa"; // Orange très clair
      case "week-end":
        return "#dbeafe"; // Bleu très clair
      case "garantie":
        return "#dcfce7"; // Vert très clair
      case "nouveau":
        return "#d1fae5"; // Vert émeraude très clair
      case "économique":
        return "#fed7aa"; // Orange très clair
      case "flexible":
        return "#dcfce7"; // Vert très clair
      default:
        return "#fed7aa"; // Orange très clair par défaut
    }
  };


  // Couleur du bouton CTA basée sur la catégorie - très foncés
  const getCtaColor = (category: string): string => {
    switch (category) {
      case "DEMENAGEMENT":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "MENAGE":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "TRANSPORT":
        return "bg-orange-600 hover:bg-orange-700 text-white";
      case "LIVRAISON":
        return "bg-purple-600 hover:bg-purple-700 text-white";
      default:
        return "bg-gray-600 hover:bg-gray-700 text-white";
    }
  };

  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden",
        "transform hover:scale-[1.02] hover:-translate-y-1",
        "w-full max-w-sm mx-auto flex flex-col border border-gray-100", // Responsive, centré, flexbox et bordure très fine
        className
      )}
      style={style}
      onClick={onClick}
    >
       {/* Badge en haut à droite */}
       {item.badgeText && (
         <div className="absolute top-1 right-3 z-10">
           <span
             className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm"
             style={{ backgroundColor: getBadgeColor(item.badgeText) }}
           >
             {item.badgeText}
           </span>
         </div>
       )}

      {/* Badge "Nouveau" en haut à gauche */}
      {item.isNewOffer && (
        <div className="absolute top-1 left-3 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-800 bg-green-100 shadow-sm">
            Nouveau
          </span>
        </div>
      )}

      {/* Image/Icône en haut à droite - déborde légèrement comme dans le design Chrono 13 */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <IconComponent className="w-8 h-8 text-gray-600" />
        </div>
      </div>

      {/* Contenu principal avec padding-bottom pour laisser de l'espace au prix et bouton */}
      <div className="p-4 pt-6 pb-24 flex-1">
        {/* Titre en haut à gauche */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 pr-20 leading-tight">
          {item.title}
        </h3>

         {/* Tags sous le titre */}
         <div className="flex gap-1 mb-3">
           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-800 bg-blue-100">
             {item.category}
           </span>
           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 bg-gray-100">
             {item.subcategory === "sur-mesure" ? "Flexible" : "Standard"}
           </span>
         </div>

        {/* Description principale */}
        <p className="text-gray-700 font-medium mb-3 text-center text-sm">
          {item.subtitle}
        </p>

        {/* Liste des caractéristiques */}
        <ul className="space-y-1 mb-4">
          {item.features.slice(0, 2).map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
              <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

      </div>

      {/* Prix fixé en bas */}
      <div className="absolute bottom-12 left-0 right-0 px-4 text-center">
        <div className="inline-flex items-center gap-2">
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs text-gray-400 line-through">
              €{item.originalPrice}
            </span>
          )}
          <span className="text-lg font-bold text-gray-900">
            {item.subcategory === "sur-mesure" ? (
              <span className="text-emerald-600">Devis gratuit</span>
            ) : (
              <>€{item.price}</>
            )}
          </span>
        </div>
      </div>

      {/* Bouton CTA collé au bas de la carte */}
      <button
        className={cn(
          "absolute bottom-0 left-0 right-0 py-2 px-3 font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm",
          "rounded-b-2xl", // Coins inférieurs arrondis pour épouser la carte
          getCtaColor(item.category)
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <span>Découvrir l'offre</span>
        <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
