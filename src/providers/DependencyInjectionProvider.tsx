'use client'

import { ReactNode, useEffect } from 'react'
import { initializeDependencyInjection } from '@/config/dependency-injection'

export function DependencyInjectionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialiser le conteneur d'injection de dépendances au chargement de l'application
    initializeDependencyInjection()
    console.log('DI Container initialized')
  }, [])

  return <>{children}</>
} 