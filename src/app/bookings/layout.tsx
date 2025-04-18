import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Réservations | Express Quote",
  description: "Gérez vos réservations de déménagement et services de nettoyage, suivez leur statut et vos paiements dans votre tableau de bord personnel.",
  openGraph: {
    title: "Tableau de bord des réservations | Express Quote",
    description: "Suivez et gérez facilement toutes vos réservations de déménagement et services de nettoyage dans votre espace personnel Express Quote.",
    type: "website",
    locale: "fr_FR",
    siteName: "Express Quote",
  },
  twitter: {
    card: "summary",
    title: "Tableau de bord des réservations | Express Quote",
    description: "Suivez et gérez facilement toutes vos réservations de déménagement et services de nettoyage dans votre espace personnel Express Quote.",
  },
  alternates: {
    canonical: "/bookings",
  },
  keywords: [
    "réservations", 
    "bookings", 
    "express quote", 
    "tableau de bord", 
    "déménagement", 
    "nettoyage", 
    "suivi de réservation",
    "gestion de paiement",
    "statut commande"
  ],
};

export default function BookingsLayout({
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