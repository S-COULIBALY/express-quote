'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import type { MovingQuote } from '@/types/quote'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ServiceDistributionChartProps {
  quotes: MovingQuote[]
}

export function ServiceDistributionChart({ quotes }: ServiceDistributionChartProps) {
  const data = useMemo(() => {
    const services = quotes.reduce((acc, quote) => {
      Object.entries(quote.options).forEach(([service, isSelected]) => {
        if (isSelected) {
          acc[service] = (acc[service] || 0) + 1
        }
      })
      return acc
    }, {} as Record<string, number>)

    return {
      labels: Object.keys(services).map(service => 
        service.charAt(0).toUpperCase() + service.slice(1)
      ),
      datasets: [{
        data: Object.values(services),
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6'
        ]
      }]
    }
  }, [quotes])

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">Distribution des Services</h3>
      <div className="h-[400px] flex items-center justify-center">
        <Pie data={data} options={options} />
      </div>
    </div>
  )
} 