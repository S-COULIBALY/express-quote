import type { Meta, StoryObj } from '@storybook/react'
import { ServiceDistributionChart } from './ServiceDistributionChart'
import { mockMovingQuotes } from '@/mocks/testData'

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
    quotes: mockMovingQuotes
  }
}

export const Empty: Story = {
  args: {
    quotes: []
  }
}

export const SingleService: Story = {
  args: {
    quotes: mockMovingQuotes.filter(q => q.options.packing)
  }
}

export const MultipleServices: Story = {
  args: {
    quotes: [
      ...mockMovingQuotes,
      {
        ...mockMovingQuotes[0],
        id: 'demo-3',
        options: { ...mockMovingQuotes[0].options, assembly: true }
      },
      {
        ...mockMovingQuotes[0],
        id: 'demo-4',
        options: { ...mockMovingQuotes[0].options, storage: true }
      }
    ]
  }
} 