'use client'

import { useState } from 'react'
import { DashboardTable } from '@/components/DashboardTable'

interface Payment {
  id: string
  quoteId: string
  amount: number
  status: 'successful' | 'pending' | 'failed'
  createdAt: string
  clientName: string
  paymentMethod: string
}

export default function PaymentsPage() {
  const [isLoading, _setIsLoading] = useState(false)

  // TODO: Implement data fetching with useEffect
  const payments: Payment[] = []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>

      <div className="bg-white shadow rounded-lg">
        <DashboardTable
          columns={[
            { header: 'Payment ID', accessor: 'id' },
            { header: 'Quote ID', accessor: 'quoteId' },
            { header: 'Client', accessor: 'clientName' },
            { 
              header: 'Status',
              accessor: (payment) => (
                <span className={`px-2 py-1 rounded-full text-sm ${
                  payment.status === 'successful' ? 'bg-green-100 text-green-800' :
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {payment.status}
                </span>
              )
            },
            { header: 'Method', accessor: 'paymentMethod' },
            { header: 'Date', accessor: 'createdAt' },
            { 
              header: 'Amount',
              accessor: (payment) => `$${payment.amount.toFixed(2)}`,
              className: 'text-right'
            }
          ]}
          data={payments}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
} 