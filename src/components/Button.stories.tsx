import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'md'
  }
}

export const Outline: Story = {
  args: {
    children: 'Button',
    variant: 'outline',
    size: 'md'
  }
}

export const Small: Story = {
  args: {
    children: 'Button',
    size: 'sm'
  }
}

export const Large: Story = {
  args: {
    children: 'Button',
    size: 'lg'
  }
}

export const Disabled: Story = {
  args: {
    children: 'Button',
    disabled: true
  }
} 