import Link from 'next/link'

export default function CleaningQuotes() {
  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Cleaning Quotes</h1>
          <Link 
            href="/cleaning/new"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Quote
          </Link>
        </div>

        {/* Liste des devis - à connecter avec l'API */}
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">No quotes yet</p>
        </div>
      </div>
    </main>
  )
} 