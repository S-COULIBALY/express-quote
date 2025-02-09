import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-12 text-center">
        Choose Your Service
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-8">
        <Link 
          href="/moving/new"
          className="flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xl font-semibold min-w-[200px]"
        >
          Moving
        </Link>

        <Link 
          href="/cleaning/new"
          className="flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xl font-semibold min-w-[200px]"
        >
          Cleaning
        </Link>
      </div>
    </main>
  )
}
