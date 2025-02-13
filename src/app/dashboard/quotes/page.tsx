'use client'

import { useState } from 'react'
import { DashboardTable } from '@/components/DashboardTable'
import { Button } from '@/components/Button'

type QuoteType = 'all' | 'moving' | 'cleaning'

export default function QuotesPage() {
  const [quoteType, setQuoteType] = useState<QuoteType>('all')
  const [_isLoading, _setIsLoading] = useState(false)

  // TODO: Implement data fetching with useEffect

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
        
        <div className="flex gap-2">
          <Button
            variant={quoteType === 'all' ? 'primary' : 'outline'}
            onClick={() => setQuoteType('all')}
          >
            All
          </Button>
          <Button
            variant={quoteType === 'moving' ? 'primary' : 'outline'}
            onClick={() => setQuoteType('moving')}
          >
            Moving
          </Button>
          <Button
            variant={quoteType === 'cleaning' ? 'primary' : 'outline'}
            onClick={() => setQuoteType('cleaning')}
          >
            Cleaning
          </Button>
        </div>
      </div>

      <DashboardTable
        columns={[
          { header: 'ID', accessor: 'id' },
          { header: 'Type', accessor: 'type' },
          { header: 'Client', accessor: 'clientName' },
          { header: 'Status', accessor: 'status' },
          { header: 'Created', accessor: 'createdAt' },
          { 
            header: 'Amount',
            accessor: (quote) => `$${quote.amount.toFixed(2)}`,
            className: 'text-right'
          }
        ]}
        data={[]} // TODO: Add real data
        isLoading={_isLoading}
        onRowClick={(quote) => {
          // TODO: Implement navigation to quote details
          console.log('Navigate to quote:', quote.id)
        }}
      />
    </div>
  )
} 