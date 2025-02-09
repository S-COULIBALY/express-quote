import { useMemo } from 'react'
import { CleaningQuote } from '@/types/quote'
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

const StatCard = React.memo(({ title, value, description, trend }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.value >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.value}%</span>
            <svg
              className={`w-4 h-4 ml-1 ${trend.value >= 0 ? 'rotate-0' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
})

StatCard.displayName = 'StatCard'

interface DashboardStatsProps {
  quotes: CleaningQuote[]
}

export function DashboardStats({ quotes }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const totalQuotes = quotes.length
    const pendingQuotes = quotes.filter(q => q.status === 'pending').length
    const completedQuotes = quotes.filter(q => q.status === 'completed').length
    const totalRevenue = quotes
      .filter(q => q.status === 'completed' || q.status === 'paid')
      .reduce((sum, q) => sum + q.estimatedPrice, 0)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentQuotes = quotes.filter(q => new Date(q.createdAt) >= thirtyDaysAgo)
    const recentRevenue = recentQuotes
      .filter(q => q.status === 'completed' || q.status === 'paid')
      .reduce((sum, q) => sum + q.estimatedPrice, 0)

    const conversionRate = totalQuotes > 0
      ? Math.round((completedQuotes / totalQuotes) * 100)
      : 0

    return {
      totalQuotes,
      pendingQuotes,
      totalRevenue,
      recentRevenue,
      conversionRate
    }
  }, [quotes])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Quotes"
        value={stats.totalQuotes}
        description="All time"
      />
      <StatCard
        title="Pending Quotes"
        value={stats.pendingQuotes}
        description="Awaiting action"
      />
      <StatCard
        title="Total Revenue"
        value={priceUtils.format(stats.totalRevenue)}
        description="All time"
        trend={{
          value: 12, // TODO: Calculer la vraie tendance
          label: 'vs last month'
        }}
      />
      <StatCard
        title="Conversion Rate"
        value={`${stats.conversionRate}%`}
        description="Quotes to completed jobs"
        trend={{
          value: 5, // TODO: Calculer la vraie tendance
          label: 'vs last month'
        }}
      />
    </div>
  )
} 