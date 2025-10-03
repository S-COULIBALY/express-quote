import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

export interface InfoItem {
  icon: LucideIcon
  iconColor: string
  iconBg: string
  label: string
  value: string | React.ReactNode
}

interface InfoCardProps {
  title: string
  titleIcon?: LucideIcon
  items: InfoItem[]
  columns?: 1 | 2
  showBadges?: boolean
  badges?: Array<{
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }>
}

export function InfoCard({ 
  title, 
  titleIcon: TitleIcon, 
  items, 
  columns = 2,
  showBadges = false,
  badges = []
}: InfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {TitleIcon && <TitleIcon className="h-5 w-5 mr-2" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-6`}>
          {columns === 2 ? (
            <>
              <div className="space-y-4">
                {items.slice(0, Math.ceil(items.length / 2)).map((item, index) => (
                  <InfoItem key={index} {...item} />
                ))}
              </div>
              <div className="space-y-4">
                {items.slice(Math.ceil(items.length / 2)).map((item, index) => (
                  <InfoItem key={index + Math.ceil(items.length / 2)} {...item} />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <InfoItem key={index} {...item} />
              ))}
            </div>
          )}
        </div>
        
        {showBadges && badges.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Options sélectionnées</h4>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <Badge 
                  key={index} 
                  variant={badge.variant || 'secondary'} 
                  className={`text-sm ${badge.className || ''}`}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InfoItem({ icon: Icon, iconColor, iconBg, label, value }: InfoItem) {
  return (
    <div className="flex items-center space-x-3">
      <div className={`p-2 ${iconBg} rounded-lg`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <div className="font-semibold">
          {typeof value === 'string' ? value : value}
        </div>
      </div>
    </div>
  )
} 