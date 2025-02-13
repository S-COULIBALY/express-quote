'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const columns = [
  { header: 'Name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
  { header: 'Phone', accessor: 'phone' },
  { 
    header: 'Quotes',
    accessor: 'quotesCount',
    className: 'text-center'
  },
  { 
    header: 'Last Quote',
    accessor: (user: User) => new Date(user.lastQuote).toLocaleDateString()
  }
]

export default function UsersPage() {
  const router = useRouter()
  const [isLoading] = useState(false)
  const users: User[] = []

  const handleExportUsers = () => {
    // TODO: Implement user export functionality
    console.log('Exporting users...')
  }

  const handleUserClick = (user: User) => {
    router.push(`/users/${user.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <Button onClick={handleExportUsers}>Export Users</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DashboardTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          onRowClick={handleUserClick}
        />
      </div>
    </div>
  )
} 