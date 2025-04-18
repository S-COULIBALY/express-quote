import React from 'react';

// URL de base dynamique selon l'environnement
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const MovingSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Services de déménagement Express Quote",
    "description": "Services de déménagement professionnel pour particuliers et entreprises. Déplacements locaux et internationaux avec emballage et transport sécurisés.",
    "url": `${baseUrl}/moving`,
    "provider": {
      "@type": "Organization",
      "name": "Express Quote",
      "logo": `${baseUrl}/logo.png`
    },
    "serviceType": "Déménagement",
    "areaServed": {
      "@type": "Country",
      "name": "France"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services de déménagement",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Déménagement résidentiel",
            "description": "Service complet pour le déménagement de résidences privées"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "450",
            "priceCurrency": "EUR"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Déménagement d'entreprise",
            "description": "Solutions professionnelles pour le déménagement d'entreprises et bureaux"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "950",
            "priceCurrency": "EUR"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Déménagement international",
            "description": "Services de déménagement pour les relocalisations internationales"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "1500",
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

export default MovingSchema; 