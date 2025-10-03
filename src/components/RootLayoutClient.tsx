'use client'

import { memo, Suspense, lazy, useEffect, useState } from 'react'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { QueryProvider } from '@/providers/QueryProvider'
import Navbar from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Toaster } from "@/components/ui/toaster"

// Import dynamique pour charger la Google Maps API uniquement quand nécessaire
const LazyGoogleMapsScript = lazy(() => import('@/components/GoogleMapsScript').then(mod => ({ default: mod.GoogleMapsScript })))

// Optimiser le layout en le mémoïsant
const MainLayout = memo(({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow pt-16">
      {children}
    </main>
    <Footer />
  </div>
))

MainLayout.displayName = 'MainLayout';

export default function RootLayoutClient({
  children
}: {
  children: React.ReactNode
}) {
  const [mapNeeded, setMapNeeded] = useState(false)
  
  // Vérifier si la page a besoin de Google Maps (par ex. pour les pages de devis)
  useEffect(() => {
    // Vérifier que window est disponible (côté client uniquement)
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Charger l'API Maps uniquement sur les pages qui en ont besoin
      if (path.includes('/catalogue/') || 
          path.includes('/contact') || 
          path.includes('/checkout')) {
        setMapNeeded(true);
      }
    }
  }, []);

  return (
    <QueryProvider>
      <NotificationProvider>
        {/* Charger Google Maps uniquement si nécessaire */}
        {mapNeeded && (
          <Suspense fallback={null}>
            <LazyGoogleMapsScript />
          </Suspense>
        )}
        <MainLayout>
          {children}
        </MainLayout>
        <Toaster />
      </NotificationProvider>
    </QueryProvider>
  )
} 