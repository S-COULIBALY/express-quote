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

interface TooltipContext {
  raw: number
  parsed: {
    y: number
  }
}

export function RevenueChart({ quotes }: RevenueChartProps) {
  const data: ChartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [{
      label: 'Revenu mensuel',
      data: Array(12).fill(0),
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1
    }]
  }

  // Calculer les revenus par mois
  quotes.forEach(quote => {
    const date = new Date(quote.createdAt)
    const monthIndex = date.getMonth()
    data.datasets[0].data[monthIndex] += quote.estimatedPrice
  })

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipContext) => {
            return `Revenu: ${priceUtils.format(context.raw)}`
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