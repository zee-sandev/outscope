'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Protected route wrapper that requires authentication
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ children, redirectTo = '/auth/login' }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, session, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage
    if (!_hasHydrated) return

    // Check if authenticated
    if (!isAuthenticated || !session) {
      router.push(redirectTo)
      return
    }

    // Check if session is expired
    const expiresAt = new Date(session.expiresAt)
    if (new Date() > expiresAt) {
      // Session expired, clear auth and redirect
      useAuthStore.getState().clearAuth()
      router.push(redirectTo)
    }
  }, [isAuthenticated, session, _hasHydrated, router, redirectTo])

  // Show loading while Zustand rehydrates from localStorage
  // Note: Session expiration is checked in useEffect to avoid hydration mismatch
  if (!_hasHydrated || !isAuthenticated || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
