import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Forfaits Déménagement | Express Quote",
  description: "Découvrez nos packs déménagement clé en main, adaptés à tous vos besoins et budgets. Solutions complètes avec équipe qualifiée, matériel et transport inclus.",
  openGraph: {
    title: "Packs & Forfaits Déménagement | Express Quote",
    description: "Des solutions clé en main pour un déménagement sans souci. Choisissez le pack qui correspond à vos besoins et votre budget avec des services tout inclus.",
    type: "website",
    locale: "fr_FR",
    siteName: "Express Quote",
  },
  twitter: {
    card: "summary",
    title: "Packs & Forfaits Déménagement | Express Quote",
    description: "Des solutions clé en main pour un déménagement sans souci. Choisissez le pack qui correspond à vos besoins et votre budget avec des services tout inclus.",
  },
  alternates: {
    canonical: "/packs",
  },
  keywords: [
    "forfait déménagement", 
    "pack déménagement", 
    "déménagement tout inclus", 
    "déménagement pas cher", 
    "tarifs déménagement",
    "offre déménagement",
    "service complet déménagement",
    "déménagement sur mesure",
    "express quote"
  ],
};

export default function PacksLayout({
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