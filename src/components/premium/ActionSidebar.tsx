import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

export interface ActionButton {
  label: string
  onClick: () => void
  icon?: LucideIcon
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

interface ActionSidebarProps {
  title?: string
  actions: ActionButton[]
  showSeparator?: boolean
  separatorIndex?: number
}

export function ActionSidebar({ 
  title = 'Actions', 
  actions, 
  showSeparator = true,
  separatorIndex = 2
}: ActionSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {showSeparator && index === separatorIndex && (
              <hr className="border-gray-200" />
            )}
            <Button
              onClick={action.onClick}
              variant={action.variant || 'outline'}
              className={`w-full ${action.className || ''}`}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  )
} 