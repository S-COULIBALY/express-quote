import Link from 'next/link'
import CleaningSchema from './schema'

export default function CleaningQuotes() {
  return (
    <main className="p-8">
      {/* Intégration du schema JSON-LD */}
      <CleaningSchema />
      
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" id="page-heading">Devis de Nettoyage</h1>
          <Link 
            href="/cleaning/new"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            aria-label="Créer un nouveau devis de nettoyage"
          >
            Nouveau Devis
          </Link>
        </header>

        <section aria-labelledby="quotes-heading">
          <h2 id="quotes-heading" className="sr-only">Liste des devis de nettoyage</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">Aucun devis pour l'instant</p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Nos services de nettoyage professionnels incluent :
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>Nettoyage résidentiel</li>
                <li>Nettoyage fin de bail</li>
                <li>Nettoyage post-travaux</li>
                <li>Nettoyage de bureaux et locaux commerciaux</li>
                <li>Services de nettoyage réguliers</li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/cleaning/new"
                  className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
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