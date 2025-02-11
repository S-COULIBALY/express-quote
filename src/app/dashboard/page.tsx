'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { dateUtils } from '@/utils/dateUtils'
import { priceUtils } from '@/utils/priceUtils'
import type { MovingQuote, QuoteStatus } from '@/types/quote'
import { useQuotes } from '@/hooks/useQuotes'
import { usePagination } from '@/hooks/usePagination'
import { Button } from '@/components/Button'
import { DashboardStats } from '@/components/DashboardStats'
import { RevenueChart } from '@/components/RevenueChart'
import { ServiceDistributionChart } from '@/components/ServiceDistributionChart'
import { QuoteFilters } from '@/components/QuoteFilters'
import { Pagination } from '@/components/Pagination'
import { DashboardTable } from '@/components/DashboardTable'

const statusColors: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const ITEMS_PER_PAGE = 10

interface FilterState {
  status: QuoteStatus | 'all'
  dateRange: string
  searchTerm: string
}

export default function Dashboard() {
  const router = useRouter()
  const { quotes, isLoading, error } = useQuotes()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: '30',
    searchTerm: ''
  })

  const filteredQuotes = useMemo(() => {
    if (!quotes) return []

    return quotes.filter(quote => {
      // Filtre par statut
      if (filters.status !== 'all' && quote.status !== filters.status) {
        return false
      }

      // Filtre par date
      const quoteDate = new Date(quote.movingDate)
      const daysAgo = (Date.now() - quoteDate.getTime()) / (1000 * 60 * 60 * 24)
      if (Number(filters.dateRange) > 0 && daysAgo > Number(filters.dateRange)) {
        return false
      }

      // Filtre par recherche
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        return (
          quote.pickupAddress.toLowerCase().includes(searchLower) ||
          quote.deliveryAddress.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [quotes, filters])

  const { paginatedItems, totalPages } = usePagination({
    items: filteredQuotes,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE
  })

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
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

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Property Type',
      'Service Type',
      'Date',
      'Time',
      'Price',
      'Status'
    ]

    const csvData = filteredQuotes.map(quote => [
      quote.id,
      quote.propertyType,
      quote.cleaningType,
      dateUtils.format(quote.preferredDate, 'short'),
      quote.preferredTime,
      priceUtils.format(quote.estimatedPrice),
      quote.status
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `cleaning-quotes-${dateUtils.format(new Date(), 'file')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardStats quotes={quotes || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart quotes={quotes || []} />
        <ServiceDistributionChart quotes={quotes || []} />
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