import { Metadata } from "next"
import Link from "next/link"
import { getLegalInformation } from "@/actions/adminLegal"
import LegalSchema from "./schema"

export const metadata: Metadata = {
  title: "Mentions Légales | Express Quote",
  description: "Mentions légales et informations sur l'entreprise Express Quote",
}

export default async function LegalPage() {
  // Récupérer les informations légales depuis la Server Action
  const legalInfo = await getLegalInformation()

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      {/* Intégration du schema JSON-LD */}
      <LegalSchema />
      
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Mentions Légales
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Informations légales concernant Express Quote
          </p>
        </div>

        {/* Informations de l'entreprise */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Informations de l'entreprise</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Raison sociale</h3>
              <p className="mt-1 text-gray-600">{legalInfo.companyName}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Forme juridique</h3>
              <p className="mt-1 text-gray-600">{legalInfo.legalForm}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Numéro d'immatriculation</h3>
              <p className="mt-1 text-gray-600">{legalInfo.registrationNumber}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Numéro de TVA</h3>
              <p className="mt-1 text-gray-600">{legalInfo.vatNumber}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Capital social</h3>
              <p className="mt-1 text-gray-600">{legalInfo.shareCapital}</p>
            </div>
          </div>
        </section>

        {/* Coordonnées légales */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Coordonnées légales</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Siège social</h3>
              <p className="mt-1 text-gray-600">
                {legalInfo.registeredAddress}<br />
                {legalInfo.postalCode} {legalInfo.city}<br />
                {legalInfo.country}
              </p>
            </div>
          </div>
        </section>

        {/* Représentants légaux */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Représentants légaux</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Représentant légal</h3>
              <p className="mt-1 text-gray-600">{legalInfo.legalRepresentative}</p>
            </div>
            {legalInfo.dataProtectionOfficer && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Délégué à la protection des données</h3>
                <p className="mt-1 text-gray-600">{legalInfo.dataProtectionOfficer}</p>
              </div>
            )}
          </div>
        </section>

        {/* Hébergement */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Informations d'hébergement</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Hébergeur</h3>
              <p className="mt-1 text-gray-600">{legalInfo.hostingProvider}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Adresse de l'hébergeur</h3>
              <p className="mt-1 text-gray-600">{legalInfo.hostingAddress}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Contact de l'hébergeur</h3>
              <p className="mt-1 text-gray-600">{legalInfo.hostingContact}</p>
            </div>
          </div>
        </section>

        {/* Mentions légales additionnelles */}
        {legalInfo.additionalMentions && (
          <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Mentions légales additionnelles</h2>
            </div>
            <div className="p-6">
              <p className="whitespace-pre-wrap text-gray-600">{legalInfo.additionalMentions}</p>
            </div>
          </section>
        )}

        {/* Liens vers d'autres pages légales */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link 
            href="/legal/privacy" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Politique de confidentialité
          </Link>
          <Link 
            href="/legal/cookies" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Politique des cookies
          </Link>
          <Link 
            href="/legal/terms" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Conditions générales
          </Link>
        </div>
      </div>
    </div>
  )
} 