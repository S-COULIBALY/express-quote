'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { FormField, Select } from '@/components/Form'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('quotes')
  const [dateRange, setDateRange] = useState('30')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      // TODO: Implement report generation
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField label="Report Type">
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: 'quotes', label: 'Quotes Summary' },
                { value: 'payments', label: 'Payments Analysis' },
                { value: 'users', label: 'User Statistics' },
                { value: 'revenue', label: 'Revenue Report' }
              ]}
            />
          </FormField>

          <FormField label="Date Range">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '365', label: 'Last year' }
              ]}
            />
          </FormField>
        </div>

        <Button
          onClick={handleGenerateReport}
          isLoading={isGenerating}
        >
          Generate Report
        </Button>
      </div>
    </div>
  )
} 