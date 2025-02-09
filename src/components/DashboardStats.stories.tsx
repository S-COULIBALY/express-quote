import type { Meta, StoryObj } from '@storybook/react'
import { DashboardStats } from './DashboardStats'
import { mockQuotes } from '@/mocks/testData'

const meta = {
  title: 'Components/DashboardStats',
  component: DashboardStats,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
} satisfies Meta<typeof DashboardStats>

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

export const WithMixedStatuses: Story = {
  args: {
    quotes: [
      ...mockQuotes,
      {
        ...mockQuotes[0],
        id: 'demo-3',
        status: 'completed',
        estimatedPrice: 500
      }
    ]
  }
} 