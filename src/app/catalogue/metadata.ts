import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services Économiques & Flexibles | ExpressQuote - Payez selon vos besoins',
  description: 'Découvrez nos services modulaires et économiques. Tarification horaire flexible : déménagement à 19€/h, ménage à 21€/h. Payez uniquement ce que vous utilisez.',
  keywords: [
    'services économiques déménagement',
    'tarification horaire flexible',
    'déménagement 19€/h',
    'ménage 21€/h',
    'services modulaires',
    'prix transparents',
    'payez selon besoins',
    'ExpressQuote'
  ],
  openGraph: {
    title: 'Services Économiques & Flexibles | ExpressQuote',
    description: 'Tarification horaire flexible : déménagement à 19€/h, ménage à 21€/h. Payez uniquement ce que vous utilisez avec nos services modulaires.',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ExpressQuote - Services Économiques & Flexibles'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services Économiques & Flexibles | ExpressQuote',
    description: 'Tarification horaire flexible : déménagement à 19€/h, ménage à 21€/h. Payez uniquement ce que vous utilisez.'
  },
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: '/catalogue'
  }
} 