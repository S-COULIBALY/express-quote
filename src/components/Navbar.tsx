'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bars3Icon, XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useState, useEffect, useCallback } from 'react'

// Memoize les liens pour éviter de les re-rendre inutilement
const NavLink = memo(({ href, isActive, children, className, onClick }: { 
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      isActive
        ? 'border-[#067857] text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    } ${className || ''}`}
    onClick={onClick}
  >
    {children}
  </Link>
));

NavLink.displayName = 'NavLink';

// Memoize le bouton d'action
const ActionButton = memo(({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#E67E22] hover:bg-[#E67E22]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E22] rounded-lg"
  >
    {children}
  </Link>
));

ActionButton.displayName = 'ActionButton';

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasItemInBasket, setHasItemInBasket] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState(0)

  const isActive = useCallback((path: string) => {
    return pathname === path
  }, [pathname])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])
  
  useEffect(() => {
    // Vérifier si des données de réservation existent
    const checkBasket = async () => {
      // Vérifier uniquement si 60 secondes se sont écoulées
      const now = Date.now()
      if (now - lastCheckTime < 60000 && lastCheckTime > 0) return
      
      try {
        // Appel API avec timestamp pour éviter le cache
        const response = await fetch(`/api/bookings/current?t=${now}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        })
        
        if (response.ok) {
          const currentBooking = await response.json()
          // Adapter à la structure de l'API qui a les items dans details.items
          const hasItems = !!(currentBooking && 
                            currentBooking.details && 
                            currentBooking.details.items && 
                            currentBooking.details.items.length > 0);
          setHasItemInBasket(hasItems);
          setLastCheckTime(now)
        } else {
          setHasItemInBasket(false)
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du panier:", error)
        setHasItemInBasket(false)
      }
    }
    
    // Vérifier au chargement de la page
    checkBasket()
    
    // Suppression de l'intervalle de rafraîchissement périodique
    // const interval = setInterval(checkBasket, 60000)
    
    // La fonction de nettoyage n'est plus nécessaire car il n'y a plus d'intervalle à nettoyer
    // return () => clearInterval(interval)
  }, [lastCheckTime])

  // Fermer le menu mobile lors des changements de route
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex flex-1">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-[#067857]">
                ExpressQuote
              </Link>
            </div>
            <div className="hidden sm:flex sm:ml-6 sm:space-x-8 items-center">
              
              <NavLink href="/catalogue" isActive={isActive('/catalogue')} onClick={closeMobileMenu}>
                Catalogue
              </NavLink>
              

              <NavLink href="/bookings" isActive={isActive('/bookings')} onClick={closeMobileMenu}>
                Réservations
              </NavLink>

              <NavLink href="/admin" isActive={isActive('/admin')} onClick={closeMobileMenu}>
                Administration
              </NavLink>

              <NavLink href="/a-propos" isActive={isActive('/a-propos')} onClick={closeMobileMenu}>
                À propos
              </NavLink>
              
              <NavLink href="/contact" isActive={isActive('/contact')} onClick={closeMobileMenu}>
                Contact
              </NavLink>
              
              <ActionButton href="/catalogue">
                Demander un devis
              </ActionButton>
            </div>
          </div>

          {/* Boutons de connexion desktop */}
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            {/* Indicateur de panier */}
            {hasItemInBasket && (
              <Link
                href="/checkout/summary"
                className="relative px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:ring-0 focus:outline-none rounded-lg mr-2 transition-colors duration-200 ease-in-out"
                aria-label="Voir le panier"
              >
                <ShoppingBagIcon className="h-6 w-6 text-emerald-600 hover:text-emerald-700" />
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  1
                </span>
              </Link>
            )}
            
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#067857] rounded-lg"
            >
              S'identifier
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-[#E67E22] hover:bg-[#E67E22]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E22] rounded-lg"
            >
              S'inscrire
            </Link>
          </div>

          {/* Bouton menu mobile */}
          <div className="flex items-center sm:hidden">
            {/* Indicateur de panier mobile */}
            {hasItemInBasket && (
              <Link
                href="/checkout/summary"
                className="relative mr-3 px-2 py-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-0 transition-colors duration-200 ease-in-out"
                aria-label="Voir le panier"
              >
                <ShoppingBagIcon className="h-6 w-6 text-emerald-600 hover:text-emerald-700" />
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  1
                </span>
              </Link>
            )}
            
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#067857]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Ouvrir le menu principal</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div 
        id="mobile-menu"
        className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} absolute w-full bg-white shadow-lg z-50`}
      >
        <div className="pt-2 pb-3 space-y-1">
          <NavLink href="/catalogue" isActive={isActive('/catalogue')} onClick={closeMobileMenu}>
            Catalogue
          </NavLink>
          <NavLink href="/bookings" isActive={isActive('/bookings')} onClick={closeMobileMenu}>
            Réservations
          </NavLink>
          <NavLink href="/a-propos" isActive={isActive('/a-propos')} onClick={closeMobileMenu}>
            À propos
          </NavLink>
          <NavLink href="/contact" isActive={isActive('/contact')} onClick={closeMobileMenu}>
            Contact
          </NavLink>
          
          {/* Panier dans le menu mobile */}
          {hasItemInBasket && (
            <NavLink href="/checkout/summary" isActive={isActive('/checkout/summary')} onClick={closeMobileMenu}>
              <div className="flex items-center">
                <ShoppingBagIcon className="h-5 w-5 text-emerald-600 mr-2" />
                <span>Panier</span>
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">1</span>
              </div>
            </NavLink>
          )}

          {/* Boutons de connexion mobile */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <NavLink href="/login" isActive={isActive('/login')} onClick={closeMobileMenu}>
              S'identifier
            </NavLink>
            <NavLink href="/register" isActive={isActive('/register')} onClick={closeMobileMenu}>
              S'inscrire
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
} 