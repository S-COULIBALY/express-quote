import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Services | Express Quote",
  description: "Découvrez nos services de déménagement et de nettoyage personnalisables pour répondre à tous vos besoins, avec des prix transparents et des prestations à la carte.",
  openGraph: {
    title: "Services de déménagement et nettoyage | Express Quote",
    description: "Des prestations sur mesure pour répondre à tous vos besoins. Sélectionnez les services qui vous conviennent pour un déménagement personnalisé.",
    type: "website",
    locale: "fr_FR",
    siteName: "Express Quote",
  },
  twitter: {
    card: "summary",
    title: "Services de déménagement et nettoyage | Express Quote",
    description: "Des prestations sur mesure pour répondre à tous vos besoins. Sélectionnez les services qui vous conviennent pour un déménagement personnalisé.",
  },
  alternates: {
    canonical: "/services",
  },
  keywords: [
    "services déménagement", 
    "services nettoyage", 
    "express quote", 
    "déménagement personnalisé", 
    "prestation sur mesure", 
    "service à la carte",
    "tarif déménagement",
    "service professionnel",
    "monte-meuble"
  ],
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 