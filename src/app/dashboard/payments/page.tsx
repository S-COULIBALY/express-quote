'use client'

import { useState } from 'react'
import { DashboardTable } from '@/components/DashboardTable'

interface Payment {
  id: string
  clientName: string
  amount: number
  status: 'successful' | 'pending' | 'failed'
  paymentMethod: string
  createdAt: string
}

const columns = [
  { header: 'Client', accessor: 'clientName' },
  { 
    header: 'Status',
    accessor: (payment: Payment) => (
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
  { 
    header: 'Date',
    accessor: (payment: Payment) => new Date(payment.createdAt).toLocaleDateString()
  },
  { 
    header: 'Amount',
    accessor: (payment: Payment) => new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(payment.amount),
    className: 'text-right'
  }
]

export default function PaymentsPage() {
  const [isLoading] = useState(false)
  const payments: Payment[] = []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DashboardTable
          columns={columns}
          data={payments}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
} 