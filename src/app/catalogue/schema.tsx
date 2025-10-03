export default function CatalogueSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Catalogue Déménagement Premium | ExpressQuote",
    "description": "Découvrez notre sélection curée de packs de déménagement premium. Solutions adaptées à tous les besoins et budgets.",
    "url": "https://express-quote.com/catalogue",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Packs Déménagement Sélectionnés",
      "description": "Notre sélection de packs de déménagement premium",
      "itemListElement": [
        {
          "@type": "Service",
          "name": "Studio & T1",
          "description": "Déménagement complet pour studio et T1, idéal pour étudiants et jeunes actifs",
          "provider": {
            "@type": "Organization",
            "name": "ExpressQuote"
          },
          "offers": {
            "@type": "Offer",
            "price": "299",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          }
        },
        {
          "@type": "Service",
          "name": "Famille T3-T4",
          "description": "Solution complète pour familles, avec service premium et garanties étendues",
          "provider": {
            "@type": "Organization",
            "name": "ExpressQuote"
          },
          "offers": {
            "@type": "Offer",
            "price": "899",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          }
        },
        {
          "@type": "Service",
          "name": "Maison Premium",
          "description": "Déménagement de luxe avec service conciergerie et finitions premium",
          "provider": {
            "@type": "Organization",
            "name": "ExpressQuote"
          },
          "offers": {
            "@type": "Offer",
            "price": "1499",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          }
        }
      ]
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://express-quote.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Catalogue",
          "item": "https://express-quote.com/catalogue"
        }
      ]
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
} 