import { Metadata } from "next"
import AboutSchema from "./schema"

export const metadata: Metadata = {
  title: "À propos | Express Quote",
  description: "Découvrez l'histoire et la mission d'Express Quote, spécialiste du déménagement et nettoyage avec devis instantanés et personnalisés.",
  openGraph: {
    title: "À propos d'Express Quote",
    description: "Découvrez notre mission, notre histoire et nos engagements pour vous offrir les meilleurs services de déménagement et nettoyage.",
    type: "website",
    locale: "fr_FR",
    siteName: "Express Quote",
  },
  twitter: {
    card: "summary",
    title: "À propos d'Express Quote",
    description: "Découvrez notre mission, notre histoire et nos engagements pour vous offrir les meilleurs services de déménagement et nettoyage.",
  },
  alternates: {
    canonical: "/a-propos",
  },
  keywords: [
    "déménagement", 
    "nettoyage", 
    "express quote", 
    "devis instantané", 
    "services de déménagement", 
    "entreprise de nettoyage",
    "services professionnels",
    "à propos"
  ],
}

export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      {/* Intégration du schema JSON-LD */}
      <AboutSchema />
      
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            À propos d'Express Quote
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Découvrez notre mission, notre histoire et nos engagements
          </p>
        </div>

        {/* Notre mission */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Notre mission</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Chez Express Quote, notre mission est de simplifier les processus de déménagement et de nettoyage pour nos clients. 
              Nous proposons des solutions sur mesure, adaptées à vos besoins spécifiques, avec des devis instantanés et transparents.
            </p>
            <p>
              Fondée sur des valeurs de qualité, de fiabilité et d'innovation, notre entreprise s'engage à offrir des services professionnels 
              qui répondent aux plus hauts standards du marché.
            </p>
          </div>
        </section>

        {/* Notre histoire */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Notre histoire</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Express Quote a été créée par une équipe de professionnels du déménagement et du nettoyage qui a identifié un besoin 
              crucial sur le marché : offrir des devis rapides, précis et personnalisés pour des services essentiels.
            </p>
            <p>
              Après des années d'expérience dans le secteur, nous avons développé une plateforme innovante qui permet à nos clients 
              d'obtenir instantanément des estimations précises pour leurs besoins en déménagement et nettoyage.
            </p>
          </div>
        </section>

        {/* Nos engagements */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Nos engagements</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Nous nous engageons à fournir des services de qualité supérieure, avec des équipes professionnelles et formées, 
              un équipement moderne et des méthodes efficaces.
            </p>
            <p>
              La satisfaction client est au cœur de notre démarche. Nous garantissons une transparence totale, des prix compétitifs 
              et un service client réactif et attentif.
            </p>
            <p>
              Nous sommes également engagés dans une démarche écologique, utilisant des produits respectueux de l'environnement 
              et optimisant nos trajets pour réduire notre empreinte carbone.
            </p>
          </div>
        </section>

        {/* Notre équipe */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Notre équipe</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Express Quote s'appuie sur une équipe de professionnels expérimentés et passionnés, dédiés à offrir un service 
              d'excellence à chacun de nos clients.
            </p>
            <p>
              De nos experts en logistique à nos techniciens de nettoyage, chaque membre de notre équipe partage les mêmes valeurs 
              de qualité, de fiabilité et d'attention aux détails.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
} 