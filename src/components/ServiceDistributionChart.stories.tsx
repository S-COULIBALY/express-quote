import type { Meta, StoryObj } from '@storybook/react'
import { ServiceDistributionChart } from './ServiceDistributionChart'
import { mockQuotes } from '@/mocks/testData'

const meta = {
  title: 'Components/ServiceDistributionChart',
  component: ServiceDistributionChart,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ServiceDistributionChart>

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

export const SingleService: Story = {
  args: {
    quotes: mockQuotes.filter(q => q.cleaningType === 'standard')
  }
}

export const MultipleServices: Story = {
  args: {
    quotes: [
      ...mockQuotes,
      {
        ...mockQuotes[0],
        id: 'demo-3',
        cleaningType: 'deep',
      },
      {
        ...mockQuotes[0],
        id: 'demo-4',
        cleaningType: 'move-in',
      }
    ]
  }
} 