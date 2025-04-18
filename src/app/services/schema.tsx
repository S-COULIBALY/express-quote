import React from 'react';

// URL de base dynamique selon l'environnement
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const ServicesSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Services proposés par Express Quote",
    "description": "Des prestations sur mesure pour tous vos besoins de déménagement et nettoyage.",
    "url": `${baseUrl}/services`,
    "itemListOrder": "Unordered",
    "numberOfItems": 6,
    "itemListElement": [
      {
        "@type": "Service",
        "position": 1,
        "name": "Déménagement résidentiel",
        "description": "Service complet pour déménager votre résidence avec professionnalisme et soin.",
        "offers": {
          "@type": "Offer",
          "price": "450",
          "priceCurrency": "EUR"
        },
        "url": `${baseUrl}/services/1`
      },
      {
        "@type": "Service",
        "position": 2,
        "name": "Déménagement entreprise",
        "description": "Solution complète pour déménager votre entreprise avec un minimum d'interruption.",
        "offers": {
          "@type": "Offer",
          "price": "950",
          "priceCurrency": "EUR"
        },
        "url": `${baseUrl}/services/2`
      },
      {
        "@type": "Service",
        "position": 3,
        "name": "Nettoyage résidentiel",
        "description": "Service de nettoyage professionnel pour votre domicile.",
        "offers": {
          "@type": "Offer",
          "price": "250",
          "priceCurrency": "EUR"
        },
        "url": `${baseUrl}/services/3`
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

export default ServicesSchema; 