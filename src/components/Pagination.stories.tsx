import type { Meta, StoryObj } from '@storybook/react'
import { Pagination } from './Pagination'

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    currentPage: {
      control: { type: 'number', min: 1 }
    },
    totalPages: {
      control: { type: 'number', min: 1 }
    }
  }
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 5,
    onPageChange: (page) => console.log('Page changed to:', page)
  }
}

export const MiddlePage: Story = {
  args: {
    currentPage: 3,
    totalPages: 5,
    onPageChange: (page) => console.log('Page changed to:', page)
  }
}

export const LastPage: Story = {
  args: {
    currentPage: 5,
    totalPages: 5,
    onPageChange: (page) => console.log('Page changed to:', page)
  }
}

export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    onPageChange: (page) => console.log('Page changed to:', page)
  }
} 