import React from 'react';

// Correction pour avoir des URLs cohérentes
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://express-quote.com' 
  : 'http://localhost:3000';

const ContactSchema = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Express Quote",
    "description": "Services de déménagement et nettoyage sur mesure",
    "url": `${baseUrl}/contact`,
    "logo": `${baseUrl}/logo.png`,
    "image": `${baseUrl}/images/office.jpg`,
    "telephone": "+33123456789",
    "email": "contact@express-quote.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Avenue des Champs-Élysées",
      "addressLocality": "Paris",
      "postalCode": "75008",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "48.8731734",
      "longitude": "2.2922926"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "10:00",
        "closes": "15:00"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "telephone": "+33987654321",
      "areaServed": "FR",
      "availableLanguage": ["French", "English"]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default ContactSchema; 