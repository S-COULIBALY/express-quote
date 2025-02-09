'use client'

import { useState } from 'react'
import { DashboardTable } from '@/components/DashboardTable'
import { Button } from '@/components/Button'

interface User {
  id: string
  name: string
  email: string
  phone: string
  quotesCount: number
  lastQuote: string
}

export default function UsersPage() {
  const [isLoading, setIsLoading] = useState(false)

  // TODO: Implement data fetching with useEffect
  const users: User[] = []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <Button>Export Users</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DashboardTable
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Phone', accessor: 'phone' },
            { 
              header: 'Quotes',
              accessor: 'quotesCount',
              className: 'text-center'
            },
            { header: 'Last Quote', accessor: 'lastQuote' }
          ]}
          data={users}
          isLoading={isLoading}
          onRowClick={(user) => {
            // TODO: Implement user details view
            console.log('View user:', user.id)
          }}
        />
      </div>
    </div>
  )
} 