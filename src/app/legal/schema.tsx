import React from 'react';

// URL de base dynamique selon l'environnement
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const LegalSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Mentions légales et conditions d'utilisation - Express Quote",
    "description": "Mentions légales, conditions générales, politique de confidentialité et d'utilisation des cookies d'Express Quote.",
    "url": `${baseUrl}/legal`,
    "publisher": {
      "@type": "Organization",
      "name": "Express Quote",
      "logo": `${baseUrl}/logo.png`
    },
    "mainContentOfPage": {
      "@type": "WebPageElement",
      "isPartOf": {
        "@id": `${baseUrl}/legal`
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", "h2", "p"]
      }
    },
    "specialty": "Informations légales",
    "significantLink": [
      {
        "@type": "WebPage",
        "url": `${baseUrl}/legal/terms`,
        "name": "Conditions Générales d'Utilisation"
      },
      {
        "@type": "WebPage",
        "url": `${baseUrl}/legal/privacy`,
        "name": "Politique de Confidentialité"
      },
      {
        "@type": "WebPage",
        "url": `${baseUrl}/legal/cookies`,
        "name": "Politique des Cookies"
      }
    ],
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Mentions Légales",
          "item": `${baseUrl}/legal`
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

export default LegalSchema; 