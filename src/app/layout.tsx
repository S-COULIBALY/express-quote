'use client'

import { NotificationProvider } from '@/contexts/NotificationContext'
import { QueryProvider } from '@/providers/QueryProvider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { GoogleMapsScript } from '@/components/GoogleMapsScript'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <QueryProvider>
          <NotificationProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </NotificationProvider>
        </QueryProvider>
        <GoogleMapsScript />
      </body>
    </html>
  )
}
