'use client'

import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: number[] = []
    const showPages = 5 // Nombre de pages à afficher
    
    const startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
    const endPage = Math.min(startPage + showPages - 1, totalPages)
    
    const adjustedStartPage = endPage - startPage + 1 < showPages 
      ? Math.max(1, endPage - showPages + 1) 
      : startPage

    for (let i = adjustedStartPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      {getPageNumbers().map(page => (
        <Button
          key={page}
          variant={currentPage === page ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
} 