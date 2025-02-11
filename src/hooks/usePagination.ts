import { useMemo } from 'react'

interface UsePaginationProps<T> {
  items: T[]
  currentPage: number
  itemsPerPage: number
}

interface UsePaginationResult<T> {
  paginatedItems: T[]
  totalPages: number
}

export function usePagination<T>({
  items,
  currentPage,
  itemsPerPage
}: UsePaginationProps<T>): UsePaginationResult<T> {
  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginatedItems = useMemo(
    () => items.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [items, currentPage, itemsPerPage]
  )

  return {
    paginatedItems,
    totalPages
  }
} 