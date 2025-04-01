'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

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
              
            <Link
                href="/packs"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/packs')
                    ? 'border-[#067857] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Nos Forfaits
              </Link>
              
              <Link
                href="/services"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/services')
                    ? 'border-[#067857] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Nos Services
              </Link>

              <Link
                href="/reservations"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/reservations')
                    ? 'border-[#067857] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Réservations
              </Link>
              <Link
                href="/a-propos"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/a-propos')
                    ? 'border-[#067857] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                À propos
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/contact')
                    ? 'border-[#067857] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Contact
              </Link>
              <Link
                href="/moving/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#E67E22] hover:bg-[#E67E22]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E22] rounded-lg"
              >
                Demander un devis
              </Link>
            </div>
          </div>

          {/* Boutons de connexion desktop */}
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
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
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#067857]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
      <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} absolute w-full bg-white shadow-lg z-50`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/services"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/services')
                ? 'bg-emerald-50 border-[#067857] text-[#067857]'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
            onClick={closeMobileMenu}
          >
            Services
          </Link>
          <Link
            href="/packs"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/packs')
                ? 'bg-emerald-50 border-[#067857] text-[#067857]'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
            onClick={closeMobileMenu}
          >
            Packs
          </Link>
          <Link
            href="/moving/new"
            className="block mx-3 mt-2 px-4 py-2 text-base font-medium text-white bg-[#E67E22] hover:bg-[#E67E22]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E22] rounded-lg text-center"
            onClick={closeMobileMenu}
          >
            Demander un devis
          </Link>
          <Link
            href="/reservations"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/reservations')
                ? 'bg-emerald-50 border-[#067857] text-[#067857]'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
            onClick={closeMobileMenu}
          >
            Réservations
          </Link>
          <Link
            href="/a-propos"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/a-propos')
                ? 'bg-emerald-50 border-[#067857] text-[#067857]'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
            onClick={closeMobileMenu}
          >
            À propos
          </Link>
          <Link
            href="/contact"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/contact')
                ? 'bg-emerald-50 border-[#067857] text-[#067857]'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
            onClick={closeMobileMenu}
          >
            Contact
          </Link>

          {/* Boutons de connexion mobile */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href="/login"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              onClick={closeMobileMenu}
            >
              S'identifier
            </Link>
            <Link
              href="/register"
              className="block pl-3 pr-4 py-2 text-base font-medium text-white bg-[#E67E22] hover:bg-[#E67E22]/90"
              onClick={closeMobileMenu}
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 