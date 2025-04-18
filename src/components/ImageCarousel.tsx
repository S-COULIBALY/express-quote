'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  const images = [
    {
      url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=70&w=1200",
      alt: "Service de nettoyage professionnel pour appartements et maisons avec des produits écologiques - Express Quote",
      category: "cleaning"
    },
    {
      url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=70&w=1200",
      alt: "Déménagement résidentiel avec emballage sécurisé des meubles et objets fragiles - Express Quote",
      category: "moving"
    },
    {
      url: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=70&w=1200",
      alt: "Nettoyage de vitres et surfaces vitrées par des professionnels qualifiés - Express Quote",
      category: "cleaning"
    },
    {
      url: "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?auto=format&fit=crop&q=70&w=1200",
      alt: "Service de déménagement international avec transport sécurisé et suivi de vos biens - Express Quote",
      category: "moving"
    }
  ]

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  if (!mounted) return null

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            className="object-cover"
            quality={70}
          />
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded text-sm">
            {image.category === 'moving' ? 'Déménagement' : 'Nettoyage'}
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            aria-label={`Voir l'image ${index + 1}`}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  )
} 