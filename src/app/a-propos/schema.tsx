import React from 'react';

// URL de base dynamique selon l'environnement
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const AboutSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "À propos d'Express Quote",
    "description": "Découvrez Express Quote, votre partenaire pour des services de déménagement et nettoyage de qualité en France.",
    "url": `${baseUrl}/a-propos`,
    "mainEntity": {
      "@type": "Organization",
      "name": "Express Quote",
      "logo": `${baseUrl}/logo.png`,
      "url": baseUrl,
      "description": "Express Quote est une entreprise spécialisée dans les services de déménagement et nettoyage sur mesure pour particuliers et entreprises à travers la France.",
      "foundingDate": "2020-03-15",
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": "25"
      },
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

export default AboutSchema; 