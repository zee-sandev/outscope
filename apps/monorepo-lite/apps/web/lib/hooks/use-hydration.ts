'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect client-side hydration completion
 * Returns false on server and initial client render, true after hydration
 *
 * Use this to avoid hydration mismatch errors when rendering
 * content that differs between server and client (e.g., dates, locales)
 */
export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Hook that returns a value only after hydration
 * Useful for avoiding hydration mismatch with dynamic values
 *
 * @example
 * const formattedDate = useHydratedValue(() => new Date().toLocaleString(), 'Loading...')
 */
export function useHydratedValue<T>(
  getValue: () => T,
  fallback: T
): T {
  const isHydrated = useHydration()

  if (!isHydrated) {
    return fallback
  }

  return getValue()
}
