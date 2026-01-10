'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ScreenshotDisplayProps {
  src: string
  alt: string
}

export function ScreenshotDisplay({ src, alt }: ScreenshotDisplayProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative w-full max-w-5xl mx-auto bg-white rounded-lg overflow-hidden shadow-xl" style={{ aspectRatio: '16/9', maxHeight: '55vh' }}>
      {!hasError ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            className={`object-contain bg-white transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            priority
            quality={90}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1400px"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true)
              setIsLoading(false)
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-3"></div>
                <p className="text-sm text-gray-600 font-medium">Chargement de la capture d'écran...</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8">
          <div className="text-center px-4 max-w-lg w-full">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Image non trouvée</h3>
            <p className="text-sm text-gray-600 mb-6">
              Veuillez placer la capture d'écran dans{' '}
              <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono text-gray-800">
                public/images/formulaire-devis-capture.png
              </code>
            </p>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-left space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">📁 Nom du fichier :</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800 block">formulaire-devis-capture.png</code>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">📂 Emplacement :</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800 block">public/images/</code>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">🎨 Format recommandé :</p>
                <span className="text-xs text-gray-600">PNG ou WebP</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">📐 Taille recommandée :</p>
                <span className="text-xs text-gray-600">1920x1080px (ratio 16:9)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

