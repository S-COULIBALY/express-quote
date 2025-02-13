'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardTable } from '@/components/DashboardTable'
import { QuoteFilters } from '@/components/QuoteFilters'
import type { MovingQuote } from '@/types/quote'

interface FilterState {
  status: string
  cleaningType: string
  searchTerm: string
}

const columns = [
  { header: 'ID', accessor: 'id' },
  { header: 'Client', accessor: 'clientName' },
  { 
    header: 'Status',
    accessor: (quote: MovingQuote) => (
      <span className={`px-2 py-1 rounded-full text-sm ${
        quote.status === 'completed' ? 'bg-green-100 text-green-800' :
        quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {quote.status}
      </span>
    )
  },
  { header: 'Date', accessor: 'createdAt' },
  { 
    header: 'Amount',
    accessor: (quote: MovingQuote) => `$${quote.estimatedPrice.toFixed(2)}`,
    className: 'text-right'
  }
]

export default function QuotesPage() {
  const router = useRouter()
  const [isLoading] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    cleaningType: 'all',
    searchTerm: ''
  })

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      cleaningType: 'all',
      searchTerm: ''
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <QuoteFilters
          onFilter={handleFilterChange}
          onReset={handleResetFilters}
          initialFilters={filters}
        />

        <DashboardTable
          columns={columns}
          data={[]} // TODO: Add real data
          isLoading={isLoading}
          onRowClick={(quote) => router.push(`/quotes/${quote.id}`)}
        />
      </div>
    </div>
  )
} 