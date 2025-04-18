import React from 'react';

// URL de base dynamique selon l'environnement
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const CleaningSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Services de nettoyage professionnel Express Quote",
    "description": "Services de nettoyage professionnel pour particuliers et entreprises. Nettoyage régulier, fin de bail, vitrerie et services spécialisés.",
    "url": `${baseUrl}/cleaning`,
    "provider": {
      "@type": "Organization",
      "name": "Express Quote",
      "logo": `${baseUrl}/logo.png`
    },
    "serviceType": "Nettoyage",
    "areaServed": {
      "@type": "Country",
      "name": "France"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services de nettoyage",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Nettoyage résidentiel",
            "description": "Service de nettoyage complet pour appartements et maisons"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "150",
            "priceCurrency": "EUR"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Nettoyage fin de bail",
            "description": "Nettoyage professionnel de fin de bail pour récupérer votre caution"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "250",
            "priceCurrency": "EUR"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Nettoyage de bureaux",
            "description": "Services de nettoyage pour espaces de travail et bureaux"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "350",
            "priceCurrency": "EUR"
          }
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default CleaningSchema; 