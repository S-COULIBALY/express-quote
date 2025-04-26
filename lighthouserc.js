module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/cleaning/new'
      ],
      numberOfRuns: 3
    },
    upload: {
      target: 'temporary-public-storage'
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'performance-budget': ['error', { resourceCounts: {
          total: { maxNumericValue: 200 },
          script: { maxNumericValue: 20 },
          stylesheet: { maxNumericValue: 10 }
        }}]
      }
    }
  }
} 