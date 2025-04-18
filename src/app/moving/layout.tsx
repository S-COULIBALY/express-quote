import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Devis de Déménagement | Express Quote",
  description: "Obtenez un devis personnalisé pour votre déménagement en quelques clics. Service complet avec emballage, transport sécurisé et installation pour particuliers et entreprises.",
  openGraph: {
    title: "Devis de Déménagement | Express Quote",
    description: "Calculez le coût de votre déménagement en quelques étapes. Prestation complète avec équipe professionnelle et matériel adapté à vos besoins.",
    type: "website",
    locale: "fr_FR",
    siteName: "Express Quote",
  },
  twitter: {
    card: "summary",
    title: "Devis de Déménagement | Express Quote",
    description: "Calculez le coût de votre déménagement en quelques étapes. Prestation complète avec équipe professionnelle et matériel adapté à vos besoins.",
  },
  alternates: {
    canonical: "/moving",
  },
  keywords: [
    "devis déménagement", 
    "service déménagement", 
    "déménagement professionnel", 
    "entreprise déménagement", 
    "déménageur",
    "transport meubles",
    "emballage déménagement",
    "déménagement prix",
    "express quote"
  ],
};

export default function MovingLayout({
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