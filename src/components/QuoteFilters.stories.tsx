import type { Meta, StoryObj } from '@storybook/react'
import { QuoteFilters } from './QuoteFilters'

const meta = {
  title: 'Components/QuoteFilters',
  component: QuoteFilters,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
} satisfies Meta<typeof QuoteFilters>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onFilter: (filters) => console.log('Filters:', filters),
    onReset: () => console.log('Reset filters')
  }
}

export const WithInitialFilters: Story = {
  args: {
    onFilter: (filters) => console.log('Filters:', filters),
    onReset: () => console.log('Reset filters'),
    initialFilters: {
      status: 'pending',
      cleaningType: 'standard',
      searchTerm: 'test'
    }
  }
} 