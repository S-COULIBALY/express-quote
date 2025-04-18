import React from 'react';

// URL de base dynamique selon l'environnement
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const PacksSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Packs Déménagement Express Quote",
    "description": "Des solutions clé en main pour un déménagement sans souci, adaptées à vos besoins et budget.",
    "url": `${baseUrl}/packs`,
    "itemListOrder": "Unordered",
    "numberOfItems": 3,
    "itemListElement": [
      {
        "@type": "Product",
        "position": 1,
        "name": "Pack Essentiel",
        "description": "Solution économique pour un petit déménagement avec l'essentiel des services.",
        "offers": {
          "@type": "Offer",
          "price": "350",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        },
        "url": `${baseUrl}/packs/1`
      },
      {
        "@type": "Product",
        "position": 2,
        "name": "Pack Confort",
        "description": "Solution complète pour un déménagement standard avec tous les services nécessaires.",
        "offers": {
          "@type": "Offer",
          "price": "650",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        },
        "url": `${baseUrl}/packs/2`
      },
      {
        "@type": "Product",
        "position": 3,
        "name": "Pack Premium",
        "description": "Solution tout inclus pour un déménagement sans stress avec services premium.",
        "offers": {
          "@type": "Offer",
          "price": "950",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        },
        "url": `${baseUrl}/packs/3`
      }
    ],
    "provider": {
      "@type": "Organization",
      "name": "Express Quote",
      "logo": `${baseUrl}/logo.png`
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default PacksSchema; 