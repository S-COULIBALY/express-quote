// 🔹 Empêcher le chargement multiple de Google Maps
let isLoading = false
let isInitialized = false
let initializationPromise: Promise<void> | null = null

// Déclaration modifiée pour éviter les conflits de type
declare global {
  interface Window {
    initGoogleMapsCallback?: () => void;  // Marqué comme optionnel
  }
}

export const initializeGoogleMaps = () => {
  if (isInitialized) return Promise.resolve()
  if (initializationPromise) return initializationPromise
  if (isLoading) return new Promise<void>(resolve => setTimeout(() => resolve(), 100))

  isLoading = true

  initializationPromise = new Promise((resolve, reject) => {
    // Définir le callback avant de charger le script
    window.initGoogleMapsCallback = () => {
      isInitialized = true
      isLoading = false
      resolve()
    }

    // Créer et configurer le script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initGoogleMapsCallback`
    script.async = true
    script.defer = true

    script.onerror = () => {
      isLoading = false
      isInitialized = false
      reject(new Error('Google Maps failed to load'))
    }

    // Ajouter le script au document
    document.head.appendChild(script)
  })

  return initializationPromise
}