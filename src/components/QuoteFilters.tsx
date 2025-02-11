'use client'

import { useState } from 'react'
import { Button } from './Button'
import { FormField, TextInput, Select } from './Form'

interface FilterOptions {
  status: string
  cleaningType: string
  searchTerm: string
}

interface QuoteFiltersProps {
  onFilter: (filters: FilterOptions) => void
  onReset: () => void
  initialFilters?: Partial<FilterOptions>
}

export function QuoteFilters({ onFilter, onReset, initialFilters }: QuoteFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    cleaningType: 'all',
    searchTerm: ''
  })

  const handleChange = (name: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    onFilter(newFilters)
  }

  const handleReset = () => {
    setFilters({
      status: 'all',
      cleaningType: 'all',
      searchTerm: ''
    })
    onReset()
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 flex-1">
          <TextInput
            type="search"
            placeholder="Search quotes..."
            value={filters.searchTerm}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Less Filters' : 'More Filters'}
        </Button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
          <FormField label="Service Type">
            <Select
              value={filters.cleaningType}
              onChange={(e) => handleChange('cleaningType', e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'standard', label: 'Standard Cleaning' },
                { value: 'deep', label: 'Deep Cleaning' },
                { value: 'move-in', label: 'Move-in/Move-out' },
                { value: 'post-construction', label: 'Post Construction' }
              ]}
            />
          </FormField>

          <div className="md:col-span-3 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Reset Filters
            </Button>
            <Button
              onClick={() => onFilter(filters)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 