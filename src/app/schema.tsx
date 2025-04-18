import React from 'react';

// Correction pour avoir des URLs cohérentes
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const HomeSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Express Quote",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Express Quote propose des services de déménagement et nettoyage sur mesure avec des devis instantanés pour particuliers et professionnels.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Avenue des Champs-Élysées",
      "addressLocality": "Paris",
      "postalCode": "75008",
      "addressCountry": "FR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33123456789",
      "contactType": "customer service",
      "availableLanguage": ["French", "English"]
    },
    "sameAs": [
      "https://www.facebook.com/expressquote",
      "https://www.instagram.com/expressquote",
      "https://www.linkedin.com/company/expressquote"
    ],
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "highPrice": "1200",
      "lowPrice": "120",
      "offerCount": "10",
      "offers": [
        {
          "@type": "Offer",
          "name": "Pack Déménagement",
          "description": "Solution complète pour votre déménagement, adaptée à vos besoins spécifiques.",
          "url": `${baseUrl}/packs`
        },
        {
          "@type": "Offer",
          "name": "Services à la carte",
          "description": "Des services personnalisés pour répondre à vos besoins spécifiques.",
          "url": `${baseUrl}/services`
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

export default HomeSchema; 