import { Metadata } from "next"
import Link from "next/link"
import { getLegalInformation } from "@/actions/adminLegal"

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Express Quote",
  description: "Politique de confidentialité et traitement des données personnelles d'Express Quote",
}

export default async function PrivacyPolicyPage() {
  // Récupérer les informations légales depuis la Server Action
  const legalInfo = await getLegalInformation()

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Politique de Confidentialité
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Comment nous traitons vos données personnelles
          </p>
        </div>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Préambule</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              La présente politique de confidentialité définit et vous informe de la manière dont {legalInfo.companyName} utilise et protège les informations que vous nous transmettez.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Collecte d'informations personnelles</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Nous pouvons collecter les informations suivantes :
            </p>
            <ul>
              <li>Nom et prénom</li>
              <li>Coordonnées de contact (adresse e-mail, numéro de téléphone)</li>
              <li>Informations démographiques (code postal, ville)</li>
              <li>Préférences et centres d'intérêt</li>
              <li>Autres informations pertinentes pour les enquêtes et/ou offres</li>
            </ul>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Utilisation des informations</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Nous utilisons ces informations pour comprendre vos besoins et vous fournir un meilleur service, et en particulier pour les raisons suivantes :
            </p>
            <ul>
              <li>Traitement de vos commandes et gestion de votre compte</li>
              <li>Amélioration de nos produits et services</li>
              <li>Envoi d'emails promotionnels sur les nouveaux produits, offres spéciales ou autres informations que nous pensons pouvoir vous intéresser</li>
              <li>Réalisation d'études de marché</li>
              <li>Personnalisation de notre site web selon vos intérêts</li>
            </ul>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Conservation des données</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Nous conservons vos données personnelles pour une durée de {legalInfo.dataRetentionPeriod} à compter de la fin de notre relation commerciale ou de votre dernier contact avec nous.
            </p>
            <p>
              À l'expiration de cette période, vos données personnelles seront supprimées ou anonymisées.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Responsable du traitement</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Le responsable du traitement des données à caractère personnel est {legalInfo.companyName}, dont le siège social est situé au {legalInfo.registeredAddress}, {legalInfo.postalCode} {legalInfo.city}, {legalInfo.country}.
            </p>
            {legalInfo.dataProtectionOfficer && (
              <p>
                Notre délégué à la protection des données est {legalInfo.dataProtectionOfficer}. Pour toute question relative à vos données personnelles, vous pouvez le contacter à l'adresse de notre siège social.
              </p>
            )}
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Vos droits</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Conformément à la réglementation en vigueur, vous disposez des droits suivants :
            </p>
            <ul>
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification de vos données personnelles</li>
              <li>Droit à l'effacement de vos données personnelles</li>
              <li>Droit à la limitation du traitement de vos données personnelles</li>
              <li>Droit à la portabilité de vos données personnelles</li>
              <li>Droit d'opposition au traitement de vos données personnelles</li>
              <li>Droit de définir des directives relatives au sort de vos données après votre décès</li>
            </ul>
            <p>
              Pour exercer ces droits, vous pouvez nous contacter par email ou par courrier postal à l'adresse de notre siège social.
            </p>
          </div>
        </section>

        {/* Liens de navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link 
            href="/legal" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Mentions légales
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