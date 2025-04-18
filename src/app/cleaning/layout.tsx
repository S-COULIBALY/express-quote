import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Devis de Nettoyage | Express Quote",
  description: "Obtenez un devis instantané pour vos besoins de nettoyage professionnel. Service complet pour particuliers et entreprises, fin de bail, post-travaux et entretien régulier.",
  openGraph: {
    title: "Devis de Nettoyage Professionnel | Express Quote",
    description: "Demandez votre devis de nettoyage personnalisé en quelques clics. Tarifs transparents et service de qualité pour tous types de nettoyages.",
    type: "website",
    locale: "fr_FR",
    siteName: "Express Quote",
  },
  twitter: {
    card: "summary",
    title: "Devis de Nettoyage Professionnel | Express Quote",
    description: "Demandez votre devis de nettoyage personnalisé en quelques clics. Tarifs transparents et service de qualité pour tous types de nettoyages.",
  },
  alternates: {
    canonical: "/cleaning",
  },
  keywords: [
    "devis nettoyage", 
    "nettoyage professionnel", 
    "service de nettoyage", 
    "nettoyage fin de bail", 
    "tarif nettoyage",
    "nettoyage entreprise",
    "nettoyage post-travaux",
    "société de nettoyage",
    "express quote"
  ],
};

export default function CleaningLayout({
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