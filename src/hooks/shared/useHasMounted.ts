import { useState, useEffect } from 'react';

/**
 * Hook qui vérifie si le composant est monté côté client
 * Utile pour éviter les erreurs d'hydratation avec Next.js
 */
export const useHasMounted = (): boolean => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}; 