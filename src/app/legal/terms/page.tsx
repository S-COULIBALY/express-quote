import { Metadata } from "next"
import Link from "next/link"
import { getLegalInformation } from "@/actions/adminLegal"

export const metadata: Metadata = {
  title: "Conditions Générales | Express Quote",
  description: "Conditions générales de vente et d'utilisation d'Express Quote",
}

export default async function TermsPage() {
  // Récupérer les informations légales depuis la Server Action
  const legalInfo = await getLegalInformation()

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Conditions Générales
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Conditions régissant l'utilisation de nos services
          </p>
        </div>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Préambule</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Les présentes conditions générales régissent l'utilisation des services proposés par {legalInfo.companyName}, société {legalInfo.legalForm} au capital de {legalInfo.shareCapital}, immatriculée au Registre du Commerce et des Sociétés sous le numéro {legalInfo.registrationNumber}, dont le siège social est situé {legalInfo.registeredAddress}, {legalInfo.postalCode} {legalInfo.city}, {legalInfo.country}.
            </p>
            <p>
              Toute utilisation des services proposés par {legalInfo.companyName} implique l'acceptation sans réserve des présentes conditions générales.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">1. Services proposés</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              {legalInfo.companyName} propose des services de devis et de réservation de déménagement, de nettoyage et autres services associés.
            </p>
            <p>
              Les services proposés sont décrits en détail sur le site internet d'Express Quote. Les prix indiqués sont ceux en vigueur au moment de la réservation.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">2. Réservation et paiement</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              La réservation d'un service s'effectue en ligne sur le site d'Express Quote. La réservation n'est définitive qu'après confirmation par Express Quote et paiement de l'acompte par le client.
            </p>
            <p>
              Les modes de paiement acceptés sont ceux indiqués sur le site au moment de la réservation. Le paiement s'effectue en euros, toutes taxes comprises.
            </p>
            <p>
              Le solde du prix est payable au plus tard le jour de la prestation, sauf conditions particulières mentionnées dans le devis.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">3. Annulation et modification</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Toute annulation ou modification de réservation doit être notifiée à Express Quote dans les meilleurs délais. Les conditions d'annulation sont les suivantes :
            </p>
            <ul>
              <li>Annulation plus de 14 jours avant la date de prestation : remboursement intégral de l'acompte</li>
              <li>Annulation entre 14 et 7 jours avant la date de prestation : remboursement de 50% de l'acompte</li>
              <li>Annulation moins de 7 jours avant la date de prestation : aucun remboursement</li>
            </ul>
            <p>
              Express Quote se réserve le droit d'annuler une prestation en cas de force majeure. Dans ce cas, le client sera remboursé intégralement des sommes versées.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">4. Assurance</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Express Quote dispose d'une assurance responsabilité civile professionnelle couvrant les dommages pouvant survenir pendant la prestation.
            </p>
            <p>
              Le client est invité à souscrire une assurance complémentaire pour les biens de valeur. Express Quote propose une assurance optionnelle dont les conditions sont précisées lors de la réservation.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">5. Responsabilité</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Express Quote s'engage à exécuter les prestations avec soin et diligence. Sa responsabilité est limitée aux dommages directs et prévisibles résultant d'une faute prouvée dans l'exécution des prestations.
            </p>
            <p>
              Express Quote ne saurait être tenue responsable des dommages indirects, tels que perte de chance, perte de revenus ou autres.
            </p>
            <p>
              Le client demeure responsable des informations fournies à Express Quote pour la réalisation des prestations. Toute information erronée pouvant entraîner des surcoûts ou complications sera à la charge du client.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">6. Propriété intellectuelle</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              L'ensemble des éléments du site Express Quote (textes, graphismes, logos, photos, etc.) est protégé par le droit d'auteur et demeure la propriété exclusive d'Express Quote ou de ses partenaires.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle, des éléments du site est strictement interdite sans l'autorisation écrite préalable d'Express Quote.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">7. Droit applicable et juridiction compétente</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Les présentes conditions générales sont soumises au droit français. En cas de litige, les tribunaux du ressort du siège social d'Express Quote seront seuls compétents.
            </p>
            <p>
              Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, le client peut recourir au service de médiation proposé par Express Quote. Le médiateur peut être saisi par courrier adressé au siège social d'Express Quote.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">8. Modification des conditions générales</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Express Quote se réserve le droit de modifier les présentes conditions générales à tout moment. Les conditions applicables sont celles en vigueur à la date de la réservation.
            </p>
            <p>
              Les conditions générales à jour sont disponibles en permanence sur le site Express Quote.
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
        </div>
      </div>
    </div>
  )
} 