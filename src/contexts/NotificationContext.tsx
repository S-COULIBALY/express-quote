'use client'

import { createContext, useContext, ReactNode } from 'react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const showNotification = (type: NotificationType, message: string) => {
    // TODO: Implémenter un système de notification (toast)
    console.log(`${type}: ${message}`)
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
} 