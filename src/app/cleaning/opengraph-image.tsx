import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'ExpressQuote - Devis de nettoyage professionnel'
export const size = {
  width: 1200,
  height: 630,
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(to bottom, #f0fff4, #ffffff)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: 'linear-gradient(to right, #10b981, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: 'white' }}
            >
              <path
                d="M9 17l6-4-6-4v8z"
                fill="white"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 48, fontWeight: 'bold', color: '#0f172a' }}>
            Express Quote
          </span>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#047857',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          Devis de Nettoyage
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#334155',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Service professionnel pour particuliers et entreprises
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 48,
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            borderRadius: 8,
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          Demandez votre devis personnalisé
        </div>
      </div>
    ),
    { ...size }
  )
} 