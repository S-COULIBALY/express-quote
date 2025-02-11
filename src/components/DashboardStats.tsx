import { useMemo } from 'react'
import type { MovingQuote } from '@/types/quote'
import { priceUtils } from '@/utils/priceUtils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
  }
}

function StatCard({ title, value, description, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <p className={`ml-2 flex items-baseline text-sm ${
            trend.value >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.value}%</span>
            <span className="ml-1 text-gray-500">{trend.label}</span>
          </p>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
}

interface DashboardStatsProps {
  quotes: MovingQuote[]
}

export function DashboardStats({ quotes }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const totalRevenue = quotes.reduce((sum, quote) => sum + quote.totalCost, 0)
    const pendingQuotes = quotes.filter(quote => quote.status === 'pending').length
    const completionRate = quotes.length > 0
      ? Math.round((quotes.filter(quote => quote.status === 'completed').length / quotes.length) * 100)
      : 0

    return {
      totalRevenue,
      pendingQuotes,
      completionRate
    }
  }, [quotes])

  return (
    <>
      <StatCard
        title="Revenu Total"
        value={priceUtils.format(stats.totalRevenue)}
        trend={{
          value: 12,
          label: "vs mois dernier"
        }}
      />
      <StatCard
        title="Devis en Attente"
        value={stats.pendingQuotes}
        description="Devis nécessitant une action"
      />
      <StatCard
        title="Taux de Conversion"
        value={`${stats.completionRate}%`}
        description="Devis vers services complétés"
      />
    </>
  )
} 