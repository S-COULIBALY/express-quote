import Link from 'next/link'
import MovingSchema from './schema'

export default function MovingQuotes() {
  return (
    <main className="p-8">
      {/* Intégration du schema JSON-LD */}
      <MovingSchema />
      
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" id="page-heading">Devis de Déménagement</h1>
          <Link 
            href="/moving/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            aria-label="Créer un nouveau devis de déménagement"
          >
            Nouveau Devis
          </Link>
        </header>

        <section aria-labelledby="quotes-heading">
          <h2 id="quotes-heading" className="sr-only">Liste des devis de déménagement</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">Aucun devis pour l'instant</p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Nos services de déménagement professionnels incluent :
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>Déménagement résidentiel (appartement, maison)</li>
                <li>Déménagement d'entreprise</li>
                <li>Déménagement international</li>
                <li>Transport de meubles et objets volumineux</li>
                <li>Emballage et déballage professionnel</li>
                <li>Monte-meubles disponible</li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/moving/new"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Demander un devis personnalisé
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
} 