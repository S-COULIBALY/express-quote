import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, LucideIcon } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  buttonText?: string
  buttonIcon?: LucideIcon
  onButtonClick?: () => void
  gradient?: string
  showIcon?: boolean
}

export function ErrorState({
  title = 'Erreur',
  message,
  buttonText = 'Réessayer',
  buttonIcon: ButtonIcon,
  onButtonClick,
  gradient = 'from-red-50 to-orange-50',
  showIcon = true
}: ErrorStateProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} flex items-center justify-center p-4`}>
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-6">
            {showIcon && <AlertCircle className="h-12 w-12 mx-auto mb-4" />}
            <h2 className="text-xl font-bold text-red-600 mb-2">{title}</h2>
            <p className="text-gray-600">{message}</p>
          </div>
          {onButtonClick && (
            <Button 
              onClick={onButtonClick}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {ButtonIcon && <ButtonIcon className="h-4 w-4 mr-2" />}
              {buttonText}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 