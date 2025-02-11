'use client'

import type { MovingQuote } from '@/types/quote'
import { dateUtils } from '@/utils/dateUtils'
import { priceUtils } from '@/utils/priceUtils'

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  className?: string
}

interface DashboardTableProps {
  data: MovingQuote[]
  isLoading: boolean
  onRowClick?: (quote: MovingQuote) => void
}

const columns: Column<MovingQuote>[] = [
  {
    header: 'Date',
    accessor: (quote) => dateUtils.format(quote.movingDate, 'short'),
    className: 'whitespace-nowrap'
  },
  {
    header: 'Adresse de départ',
    accessor: 'pickupAddress'
  },
  {
    header: 'Adresse d\'arrivée',
    accessor: 'deliveryAddress'
  },
  {
    header: 'Volume',
    accessor: (quote) => `${quote.volume} m³`,
    className: 'text-right'
  },
  {
    header: 'Prix Total',
    accessor: (quote) => priceUtils.format(quote.totalCost),
    className: 'text-right'
  },
  {
    header: 'Statut',
    accessor: (quote) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        quote.status === 'paid' ? 'bg-green-100 text-green-800' :
        quote.status === 'completed' ? 'bg-blue-100 text-blue-800' :
        'bg-red-100 text-red-800'
      }`}>
        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
      </span>
    )
  }
]

export function DashboardTable({ data, isLoading, onRowClick }: DashboardTableProps) {
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="mt-8 flex flex-col">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      scope="col"
                      className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 ${column.className || ''}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.length > 0 ? (
                  data.map((quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => onRowClick?.(quote)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      {columns.map((column, index) => (
                        <td
                          key={index}
                          className={`whitespace-nowrap px-3 py-4 text-sm text-gray-500 ${column.className || ''}`}
                        >
                          {typeof column.accessor === 'function'
                            ? column.accessor(quote)
                            : quote[column.accessor]}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-3 py-4 text-sm text-gray-500 text-center"
                    >
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 