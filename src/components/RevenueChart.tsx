'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { CleaningQuote } from '@/types/quote'
import { priceUtils } from '@/utils/priceUtils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface RevenueChartProps {
  quotes: CleaningQuote[]
  period?: 'year' | 'month' | 'week'
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    borderColor: string
    borderWidth: number
  }[]
}

export function RevenueChart({ quotes, period = 'month' }: RevenueChartProps) {
  const calculateMonthlyRevenue = () => {
    const monthlyData: Record<string, number> = {}
    const sortedQuotes = [...quotes].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    // Initialiser les 12 derniers mois
    const today = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7) // Format: YYYY-MM
      monthlyData[monthKey] = 0
    }

    // Calculer le revenu pour chaque mois
    sortedQuotes
      .filter(quote => quote.status === 'completed' || quote.status === 'paid')
      .forEach(quote => {
        const monthKey = new Date(quote.createdAt).toISOString().slice(0, 7)
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += quote.estimatedPrice
        }
      })

    return monthlyData
  }

  const monthlyRevenue = calculateMonthlyRevenue()
  const labels = Object.keys(monthlyRevenue).map(key => {
    const [year, month] = key.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' })
  })

  const data: ChartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: Object.values(monthlyRevenue),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Monthly Revenue',
        color: '#374151',
        font: {
          size: 16,
          weight: '500'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Revenue: ${priceUtils.format(context.raw)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => priceUtils.format(value)
        }
      }
    },
    maintainAspectRatio: false
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div style={{ height: '400px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  )
} 