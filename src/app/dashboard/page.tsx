'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuotes } from '@/hooks/useQuotes'
import { usePagination } from '@/hooks/usePagination'
import { DashboardStats } from '@/components/DashboardStats'
import { RevenueChart } from '@/components/RevenueChart'
import { ServiceDistributionChart } from '@/components/ServiceDistributionChart'
import { QuoteFilters } from '@/components/QuoteFilters'
import { Pagination } from '@/components/Pagination'
import { DashboardTable } from '@/components/DashboardTable'

const ITEMS_PER_PAGE = 10

interface FilterState {
  status: string
  dateRange: string
  searchTerm: string
}

export default function Dashboard() {
  const router = useRouter()
  const { quotes, isLoading } = useQuotes()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: '30',
    searchTerm: ''
  })

  // Filtrer les devis
  const filteredQuotes = quotes.filter(quote => {
    if (filters.status !== 'all' && quote.status !== filters.status) {
      return false
    }
    if (filters.searchTerm && !quote.id.includes(filters.searchTerm)) {
      return false
    }
    return true
  })

  // Pagination
  const { paginatedItems, totalPages } = usePagination({
    items: filteredQuotes,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE
  })

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      dateRange: '30',
      searchTerm: ''
    })
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStats quotes={quotes} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart quotes={quotes} />
        <ServiceDistributionChart quotes={quotes} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <QuoteFilters
            onFilter={handleFilterChange}
            onReset={handleResetFilters}
            initialFilters={filters}
          />

          <DashboardTable
            data={paginatedItems}
            isLoading={isLoading}
            onRowClick={(quote) => router.push(`/moving/${quote.id}`)}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
} 