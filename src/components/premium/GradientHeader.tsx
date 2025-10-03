import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface GradientHeaderProps {
  title: string
  subtitle: string
  Icon: LucideIcon
  gradient: string
  iconBg?: string
}

export function GradientHeader({ 
  title, 
  subtitle, 
  Icon, 
  gradient, 
  iconBg = 'bg-white bg-opacity-20' 
}: GradientHeaderProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className={`p-8 ${gradient} text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 ${iconBg} rounded-full`}>
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-blue-100 mt-1">{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <Icon className="h-16 w-16 text-white opacity-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 