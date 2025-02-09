import type { Meta, StoryObj } from '@storybook/react'
import { RevenueChart } from './RevenueChart'
import { mockQuotes } from '@/mocks/testData'

const meta = {
  title: 'Components/RevenueChart',
  component: RevenueChart,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
} satisfies Meta<typeof RevenueChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    quotes: mockQuotes
  }
}

export const Empty: Story = {
  args: {
    quotes: []
  }
}

export const WithVariedRevenue: Story = {
  args: {
    quotes: [
      ...mockQuotes,
      {
        ...mockQuotes[0],
        id: 'demo-3',
        estimatedPrice: 1500,
        createdAt: '2024-02-15T10:00:00Z'
      },
      {
        ...mockQuotes[0],
        id: 'demo-4',
        estimatedPrice: 800,
        createdAt: '2024-01-15T10:00:00Z'
      }
    ]
  }
}

export const SingleMonth: Story = {
  args: {
    quotes: mockQuotes.map(q => ({
      ...q,
      createdAt: '2024-03-15T10:00:00Z'
    }))
  }
} 