import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface LoadingStateProps {
  title?: string
  subtitle?: string
  gradient?: string
}

export function LoadingState({ 
  title = 'Chargement...', 
  subtitle = 'Récupération des informations',
  gradient = 'from-blue-50 to-indigo-50'
}: LoadingStateProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} flex items-center justify-center p-4`}>
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">{title}</h2>
              <p className="text-gray-600">{subtitle}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 