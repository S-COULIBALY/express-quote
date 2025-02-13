'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from 'next/link'
import { Button } from '@/components/Button'
import { useRouter } from 'next/navigation'
/* eslint-enable @typescript-eslint/no-unused-vars */

export function Header() {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/login')
  }

  const handleSignup = () => {
    router.push('/signup')
  }

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            ExpressQuote
          </Link>
          
          <div className="hidden md:flex items-center ml-10 space-x-8">
            <Link href="/services" className="text-gray-600 hover:text-gray-900">
              Services
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Tarifs
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              À propos
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="outline"
            onClick={handleLogin}
          >
            S&apos;identifier
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleSignup}
          >
            S&apos;inscrire
          </Button>
        </div>
      </nav>
    </header>
  )
} 