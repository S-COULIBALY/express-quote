'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { CleaningQuote } from '@/types/quote'
import React from 'react'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ServiceDistributionChartProps {
  quotes: CleaningQuote[]
}

export const ServiceDistributionChart = React.memo(function ServiceDistributionChart({ quotes }: ServiceDistributionChartProps) {
  const { labels, values } = useMemo(() => {
    const distribution: Record<string, number> = {}
    
    quotes.forEach(quote => {
      distribution[quote.cleaningType] = (distribution[quote.cleaningType] || 0) + 1
    })

    return {
      labels: Object.keys(distribution),
      values: Object.values(distribution)
    }
  }, [quotes])

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',  // vert
          'rgba(59, 130, 246, 0.5)', // bleu
          'rgba(249, 115, 22, 0.5)', // orange
          'rgba(168, 85, 247, 0.5)'  // violet
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 1
      }
    ]
  }), [labels, values])

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Service Type Distribution',
        color: '#374151',
        font: {
          size: 16,
          weight: '500'
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div style={{ height: '400px' }} className="flex items-center justify-center">
        <Pie data={data} options={options} />
      </div>
    </div>
  )
}) 