interface QuoteDetails {
  id: string
  type: 'moving' | 'cleaning'
  status: string
  createdAt: string
  // Ajouter d'autres champs selon les besoins
}

interface QuoteSummaryProps {
  quote: QuoteDetails
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function QuoteSummary({ 
  quote, 
  showActions = false,
  onEdit,
  onDelete 
}: QuoteSummaryProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">
            {quote.type === 'moving' ? 'Moving' : 'Cleaning'} Quote
          </h3>
          <p className="text-sm text-gray-500">ID: {quote.id}</p>
        </div>
        <span className={`px-2 py-1 text-sm rounded-full ${
          quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          quote.status === 'paid' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {quote.status}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Created on: {new Date(quote.createdAt).toLocaleDateString()}
        </p>
        {/* Ajouter d'autres détails du devis ici */}
      </div>

      {showActions && (
        <div className="mt-6 flex gap-4">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
} 