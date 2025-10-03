import 'reflect-metadata'
import { Inter } from 'next/font/google'
import RootLayoutClient from '@/components/RootLayoutClient'
import './globals.css'
import { Metadata } from 'next'
import { FormStylesSimplified } from '@/components/form-generator/styles/FormStylesSimplified'
import { globalFormPreset } from '@/components/form-generator/presets/_shared/globalPreset'

// Optimiser le chargement de la police
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial', 'sans-serif'],
  weight: ['400', '500', '600', '700']
})

// URL de base dynamique selon l'environnement
const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://express-quote.com'
  : 'http://localhost:3000';

// Définition des métadonnées
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'ExpressQuote - Devis de déménagement et nettoyage',
  description: 'Obtenez un devis instantané pour vos services de déménagement et nettoyage professionnel.',
  generator: 'Next.js',
  applicationName: 'Express Quote',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'déménagement',
    'devis déménagement',
    'nettoyage professionnel',
    'services de déménagement'
  ],
  openGraph: {
    title: 'Express Quote - Votre partenaire de déménagement et nettoyage',
    description: 'Obtenez un devis instantané pour vos services.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Express Quote',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Express Quote - Devis de déménagement et nettoyage',
    description: 'Obtenez un devis instantané pour vos services.',
  },
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="form-generator">
        {/* 🎨 Styles iOS 18 simplifiés */}
        <FormStylesSimplified globalConfig={globalFormPreset} />
        
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}
