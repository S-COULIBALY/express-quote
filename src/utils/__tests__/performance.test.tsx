import { render } from '@testing-library/react'
import { QueryProvider } from '@/providers/QueryProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { DashboardStats } from '@/components/DashboardStats'
import { RevenueChart } from '@/components/RevenueChart'
import { ServiceDistributionChart } from '@/components/ServiceDistributionChart'
import { mockQuotes } from '@/mocks/testData'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryProvider>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </QueryProvider>
)

describe('Component Performance', () => {
  it('DashboardStats renders within performance budget', () => {
    const start = performance.now()
    render(<DashboardStats quotes={mockQuotes} />, { wrapper })
    const end = performance.now()
    expect(end - start).toBeLessThan(100) // 100ms budget
  })

  it('RevenueChart renders within performance budget', () => {
    const start = performance.now()
    render(<RevenueChart quotes={mockQuotes} />, { wrapper })
    const end = performance.now()
    expect(end - start).toBeLessThan(150) // 150ms budget
  })

  it('ServiceDistributionChart renders within performance budget', () => {
    const start = performance.now()
    render(<ServiceDistributionChart quotes={mockQuotes} />, { wrapper })
    const end = performance.now()
    expect(end - start).toBeLessThan(150) // 150ms budget
  })

  it('handles large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      ...mockQuotes[0],
      id: `test-${i}`,
      estimatedPrice: Math.random() * 1000
    }))

    const start = performance.now()
    render(<DashboardStats quotes={largeDataset} />, { wrapper })
    const end = performance.now()
    expect(end - start).toBeLessThan(200) // 200ms budget for large dataset
  })
}) 