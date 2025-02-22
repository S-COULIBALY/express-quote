import { NotificationProvider } from '@/contexts/NotificationContext'
import { QueryProvider } from '@/providers/QueryProvider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { GoogleMapsProvider } from '@/components/AddressAutocomplete'
import './globals.css'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased">
        <QueryProvider>
          <NotificationProvider>
            <GoogleMapsProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
            </GoogleMapsProvider>
          </NotificationProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
