'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { dateUtils } from '@/utils/dateUtils'
import { priceUtils } from '@/utils/priceUtils'
import { QuoteStatus } from '@/types/quote'
import { useQuotes } from '@/hooks/useQuotes'
import { usePagination } from '@/hooks/usePagination'
import { Button } from '@/components/Button'
import { DashboardStats } from '@/components/DashboardStats'
import { RevenueChart } from '@/components/RevenueChart'
import { ServiceDistributionChart } from '@/components/ServiceDistributionChart'
import { QuoteFilters } from '@/components/QuoteFilters'
import { Pagination } from '@/components/Pagination'

const statusColors: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const ITEMS_PER_PAGE = 10

export default function Dashboard() {
  const router = useRouter()
  const { quotes, isLoading, updateQuoteStatus } = useQuotes()
  const [filteredQuotes, setFilteredQuotes] = useState(quotes)
  const [currentPage, setCurrentPage] = useState(1)

  const { paginatedItems: paginatedQuotes, totalPages } = usePagination({
    items: filteredQuotes,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE
  })

  useEffect(() => {
    setFilteredQuotes(quotes)
  }, [quotes])

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    updateQuoteStatus({ id: quoteId, status: newStatus })
  }

  const handleFilter = (filters: any) => {
    let filtered = [...quotes]

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(quote => 
        quote.id.toLowerCase().includes(search) ||
        quote.propertyType.toLowerCase().includes(search) ||
        quote.cleaningType.toLowerCase().includes(search)
      )
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(quote => quote.status === filters.status)
    }

    if (filters.cleaningType !== 'all') {
      filtered = filtered.filter(quote => quote.cleaningType === filters.cleaningType)
    }

    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(quote => quote.propertyType === filters.propertyType)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(quote => 
        new Date(quote.preferredDate) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(quote => 
        new Date(quote.preferredDate) <= new Date(filters.dateTo)
      )
    }

    if (filters.priceMin) {
      filtered = filtered.filter(quote => 
        quote.estimatedPrice >= Number(filters.priceMin)
      )
    }

    if (filters.priceMax) {
      filtered = filtered.filter(quote => 
        quote.estimatedPrice <= Number(filters.priceMax)
      )
    }

    setFilteredQuotes(filtered)
  }

  const handleResetFilters = () => {
    setFilteredQuotes(quotes)
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

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Cleaning Quotes</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={filteredQuotes.length === 0}
            >
              Export CSV
            </Button>
            <Button onClick={() => router.push('/cleaning/new')}>
              New Quote
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <DashboardStats quotes={quotes} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RevenueChart quotes={quotes} />
          <ServiceDistributionChart quotes={quotes} />
        </div>

        <QuoteFilters
          onFilter={handleFilter}
          onReset={handleResetFilters}
        />

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quote.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {quote.propertyType}
                    </div>
                    <div className="text-sm text-gray-500">
                      {quote.squareMeters}m²
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {quote.cleaningType}
                    </div>
                    <div className="text-sm text-gray-500">
                      {quote.frequency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {dateUtils.format(quote.preferredDate, 'short')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {quote.preferredTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {priceUtils.format(quote.estimatedPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[quote.status]}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/cleaning/${quote.id}`)}
                      >
                        View
                      </Button>
                      <select
                        value={quote.status}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value as QuoteStatus)}
                        className="text-sm rounded border-gray-300"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </main>
  )
} 