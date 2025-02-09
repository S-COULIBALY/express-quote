import { useMemo } from 'react'

interface UsePaginationProps<T> {
  items: T[]
  currentPage: number
  itemsPerPage: number
}

export function usePagination<T>({ items, currentPage, itemsPerPage }: UsePaginationProps<T>) {
  const totalPages = useMemo(() => 
    Math.ceil(items.length / itemsPerPage)
  , [items.length, itemsPerPage])

  const paginatedItems = useMemo(() => 
    items.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
  , [items, currentPage, itemsPerPage])

  return {
    paginatedItems,
    totalPages
  }
} 