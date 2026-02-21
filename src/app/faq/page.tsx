import { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes | Express Quote",
  description:
    "Toutes les réponses à vos questions sur le déménagement : tarifs, zones couvertes, visite d'estimation, paiement, assurance, annulation. Devis gratuit en 3 minutes.",
  openGraph: {
    title: "FAQ Express Quote — Questions fréquentes sur le déménagement",
    description:
      "Tarifs, zones, visite d'estimation gratuite, paiement en 2 fois, assurance, annulation. Tout ce que vous devez savoir avant votre déménagement.",
    type: "website",
    locale: "fr_FR",
    siteName: "Express Quote",
  },
  twitter: {
    card: "summary",
    title: "FAQ Express Quote — Questions fréquentes",
    description:
      "Toutes les réponses sur le déménagement : tarifs, zones, visite, paiement, assurance.",
  },
  alternates: {
    canonical: "/faq",
  },
  keywords: [
    "FAQ déménagement",
    "questions fréquentes déménagement",
    "tarif déménagement",
    "prix déménagement",
    "visite estimation gratuite",
    "assurance déménagement",
    "annulation déménagement",
    "paiement déménagement",
    "express quote",
    "devis déménagement",
  ],
};

export default function FaqPage() {
  return (
    <div className="overflow-x-hidden font-ios">
      {/* Hero */}
      <section className="hero-gradient pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <nav
              className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6 font-ios"
              aria-label="Fil d'Ariane"
            >
              <Link
                href="/"
                className="hover:text-emerald-600 transition-colors"
              >
                Accueil
              </Link>
              <span aria-hidden="true">›</span>
              <span className="text-gray-900 font-medium">FAQ</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight font-ios-bold">
              Questions <span className="text-emerald-600">fréquentes</span>
            </h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-gray-500 font-ios">
              Tout ce que vous devez savoir avant votre déménagement.{" "}
              <span className="font-semibold text-emerald-600">
                20 réponses détaillées
              </span>{" "}
              sur les tarifs, les services, le paiement et bien plus.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8 py-8 sm:py-12 md:py-16">
        <FaqAccordion />
      </main>
    </div>
  );
}
