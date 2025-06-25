'use server';
// Ce fichier permet de marquer certains modules comme utilisables uniquement côté serveur
// En important ce fichier, l'erreur 'Module not found: Can't resolve 'fs'' sera évitée

export function isServer() {
  return typeof window === 'undefined';
}

// Pour vérifier et lancer une erreur si utilisé côté client
export function ensureServer() {
  if (!isServer()) {
    throw new Error('Cette fonction ne peut être utilisée que côté serveur');
  }
} 